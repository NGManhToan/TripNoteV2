import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowLeft, BriefcaseBusiness, ChartPie, Check, ClipboardCheck, Home, MoreHorizontal, Plus, RotateCcw, Sparkles, X } from "lucide-react";
import type { Trip, TripPreparationTask } from "./data";
import { tripRouteLabel } from "./data";
import styles from "./TripPreparationPage.module.css";

type Props = { trip: Trip; onBack: () => void; onHome: () => void; onReport: () => void; onSave: (tasks: TripPreparationTask[]) => void; onNotify: (message: string) => void };
type Filter = "all" | "pending" | "completed";
type SuggestionGroup = { zone: string; accent: "sage" | "ocean"; items: string[] };

const starterTasks: TripPreparationTask[] = [
  { id: "prep-documents", title: "Kiểm tra giấy tờ tùy thân", done: false },
  { id: "prep-bookings", title: "Xác nhận vé và chỗ ở", done: false },
  { id: "prep-itinerary", title: "Xem lại lịch trình", done: false },
  { id: "prep-clothes", title: "Chuẩn bị quần áo phù hợp", done: false },
  { id: "prep-charger", title: "Sạc điện thoại và pin dự phòng", done: false },
  { id: "prep-medicine", title: "Chuẩn bị thuốc và đồ dùng cá nhân", done: false },
];

const suggestionsFor = (firstStop: string, lastStop: string): SuggestionGroup[] => [
  ...(firstStop === lastStop
    ? [{ zone: firstStop + " & hành lý", accent: "sage" as const, items: ["Áo khoác phù hợp thời tiết " + firstStop, "Thuốc chống say xe", "Giày thể thao thoải mái", "Son dưỡng và kem dưỡng ẩm", "Sạc điện thoại và pin dự phòng", "Giấy tờ tùy thân", "Kem chống nắng", "Túi đựng đồ cá nhân"] }]
    : [
        { zone: firstStop + " & chặng đường", accent: "sage" as const, items: ["Áo khoác phù hợp thời tiết " + firstStop, "Thuốc chống say xe", "Giày thể thao thoải mái", "Son dưỡng và kem dưỡng ẩm"] },
        { zone: lastStop + " & điểm đến", accent: "ocean" as const, items: ["Đồ dùng phù hợp điểm đến " + lastStop, "Kem chống nắng", "Mũ và kính râm", "Túi chống nước điện thoại"] },
      ]),
];

export default function TripPreparationPage({ trip, onBack, onHome, onReport, onSave, onNotify }: Props) {
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState("");
  const [addExpanded, setAddExpanded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [undoLabel, setUndoLabel] = useState("");
  const [canUndo, setCanUndo] = useState(false);
  const tasks = trip.preparation ?? starterTasks;
  const doneCount = tasks.filter((task) => task.done).length;
  const percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const menuRef = useRef<HTMLDivElement>(null);
  const undoRef = useRef<{ task: TripPreparationTask; index: number } | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const cancelBlur = useRef(false);
  const savedStops = trip.destinations?.map((stop) => stop.name.trim()).filter(Boolean) ?? [];
  const routeText = /(?:→|->)/.test(trip.name) ? trip.name : trip.destination || trip.name;
  const inferredStops = routeText.split(/\s*(?:→|->)\s*/).map((stop) => stop.trim()).filter(Boolean);
  const routeStops = savedStops.length > 1 ? savedStops : inferredStops.length > 1 ? inferredStops : savedStops;
  const firstStop = routeStops[0] || trip.destination || trip.name;
  const lastStop = routeStops.at(-1) || firstStop;
  const routeTitle = routeStops.length > 1 ? routeStops.join(" → ") : tripRouteLabel(trip);
  const suggestionGroups = useMemo(() => suggestionsFor(firstStop, lastStop), [firstStop, lastStop]);
  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => filter === "all" || (filter === "completed" ? task.done : !task.done));
    return filter === "all" ? [...filtered].sort((a, b) => Number(a.done) - Number(b.done)) : filtered;
  }, [filter, tasks]);

  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    const onKeyDown = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", onKeyDown); };
  }, [menuOpen]);
  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  const addTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onSave([{ id: "prep-" + crypto.randomUUID(), title, done: false }, ...tasks]);
    setDraft("");
    setAddExpanded(false);
    onNotify("Đã thêm mục chuẩn bị");
  };
  const toggleTask = (taskId: string) => onSave(tasks.map((task) => task.id === taskId ? { ...task, done: !task.done } : task));
  const deleteTask = (taskId: string) => {
    const index = tasks.findIndex((task) => task.id === taskId);
    if (index < 0) return;
    const removed = tasks[index]!;
    undoRef.current = { task: removed, index };
    onSave(tasks.filter((task) => task.id !== taskId));
    setUndoLabel("Đã xóa “" + removed.title + "”");
    setCanUndo(true);
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => { setUndoLabel(""); setCanUndo(false); undoRef.current = null; }, 4500);
  };
  const undoDelete = () => {
    const deleted = undoRef.current;
    if (!deleted) return;
    const restored = [...tasks];
    restored.splice(Math.min(deleted.index, restored.length), 0, deleted.task);
    onSave(restored);
    undoRef.current = null;
    setUndoLabel("");
    setCanUndo(false);
    window.clearTimeout(undoTimer.current);
  };
  const saveEdit = (taskId: string) => {
    const title = editDraft.trim();
    const currentTask = tasks.find((task) => task.id === taskId);
    if (title && currentTask && title !== currentTask.title) {
      onSave(tasks.map((task) => task.id === taskId ? { ...task, title } : task));
      onNotify("Đã cập nhật mục chuẩn bị");
    }
    setEditingId(null);
  };
  const handleEditKey = (event: KeyboardEvent<HTMLInputElement>, taskId: string) => {
    if (event.key === "Enter") { event.preventDefault(); saveEdit(taskId); }
    if (event.key === "Escape") { cancelBlur.current = true; setEditingId(null); }
  };
  const addSuggestion = (title: string) => {
    if (tasks.some((task) => task.title.trim().toLocaleLowerCase("vi") === title.toLocaleLowerCase("vi"))) return;
    onSave([{ id: "prep-" + crypto.randomUUID(), title, done: false }, ...tasks]);
    onNotify("Đã thêm mục chuẩn bị");
  };
  const resetTasks = () => {
    onSave(starterTasks.map((task) => ({ ...task })));
    setFilter("all");
    setMenuOpen(false);
    setUndoLabel("Đã khôi phục danh sách mặc định");
    setCanUndo(false);
    undoRef.current = null;
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndoLabel(""), 3200);
  };

  return <main className={styles.page}>
    <header className={styles.header}>
      <div className={styles.topRow}>
        <button className={styles.backButton} type="button" onClick={onBack} aria-label="Quay lại lịch trình"><ArrowLeft /></button>
        <span className={styles.eyebrow}>Chuẩn bị chuyến đi</span>
        <div className={styles.menuAnchor} ref={menuRef}>
          <button className={styles.menuButton} type="button" aria-label="Tùy chọn danh sách" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><MoreHorizontal /></button>
          <AnimatePresence>{menuOpen && <motion.div className={styles.popover} initial={reduceMotion ? false : { opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: reduceMotion ? 0 : .16 }}>
            <button type="button" onClick={() => { setMenuOpen(false); setSuggestionsOpen(true); }}><Sparkles />Gợi ý đồ cần chuẩn bị</button>
            <span />
            <button type="button" className={styles.resetOption} onClick={resetTasks}><RotateCcw />Đặt lại mặc định</button>
          </motion.div>}</AnimatePresence>
        </div>
      </div>
      <div className={styles.titleRow}>
        <div className={styles.titleCopy}>
          <div className={styles.routeBadge}><i />{firstStop}<b>→</b><i />{lastStop}</div>
          <h1>{routeTitle}</h1>
        </div>
        <div className={styles.progressRing} aria-label={"Đã hoàn thành " + percent + "%"}>
          <svg viewBox="0 0 56 56" aria-hidden="true"><circle className={styles.ringTrack} cx="28" cy="28" r="23" /><circle className={styles.ringValue} cx="28" cy="28" r="23" style={{ strokeDashoffset: 144.51 - percent / 100 * 144.51 }} /></svg>
          <span><strong>{percent}%</strong><small>{doneCount}/{tasks.length}</small></span>
        </div>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.filters} role="tablist" aria-label="Lọc danh sách chuẩn bị">
          {([{ id: "all", label: "Tất cả" }, { id: "pending", label: "Cần làm" }, { id: "completed", label: "Đã xong" }] as const).map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? styles.filterActive : styles.filter} onClick={() => setFilter(item.id)}>{item.label}</button>)}
        </div>
        <button className={styles.suggestButton} type="button" onClick={() => setSuggestionsOpen(true)}><Sparkles /><span>Gợi ý</span></button>
      </div>
    </header>
    <section className={styles.listRegion} aria-label="Các việc cần chuẩn bị">
      {visibleTasks.length ? <ul className={styles.taskList}>{visibleTasks.map((task) => <motion.li className={styles.taskRow} key={task.id} layout={!reduceMotion} initial={reduceMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: reduceMotion ? 0 : .18 }}>
        <button className={styles.checkButton + (task.done ? " " + styles.checked : "")} type="button" aria-label={(task.done ? "Đánh dấu chưa xong: " : "Đánh dấu hoàn tất: ") + task.title} aria-pressed={task.done} onClick={() => toggleTask(task.id)}>{task.done && <Check />}</button>
        <div className={styles.taskCopy}>
          {editingId === task.id ? <input className={styles.inlineEdit} value={editDraft} maxLength={90} aria-label="Sửa việc cần chuẩn bị" onChange={(event) => setEditDraft(event.target.value)} onBlur={() => { if (cancelBlur.current) { cancelBlur.current = false; return; } saveEdit(task.id); }} onKeyDown={(event) => handleEditKey(event, task.id)} /> : <button className={styles.taskTitle + (task.done ? " " + styles.taskTitleDone : "")} type="button" onClick={() => { setEditingId(task.id); setEditDraft(task.title); }}>{task.title}</button>}
        </div>
        <button className={styles.deleteButton} type="button" aria-label={"Xóa " + task.title} title="Xóa mục" onClick={() => deleteTask(task.id)}><X /></button>
      </motion.li>)}</ul> : <p className={styles.empty}>{filter === "pending" ? "Mọi thứ đã sẵn sàng cho hành trình!" : filter === "completed" ? "Chưa có mục nào hoàn thành." : "Danh sách đang trống. Hãy thêm vật dụng bên dưới."}</p>}
      {visibleTasks.length > 0 && <p className={styles.hint}>Chạm vào dòng chữ để chỉnh sửa trực tiếp</p>}
    </section>
    <AnimatePresence mode="wait" initial={false}>
      {addExpanded ? <motion.div className={styles.addBar} key="composer" initial={reduceMotion ? false : { opacity: 0, y: 12, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .97 }} transition={{ duration: reduceMotion ? 0 : .18 }}>
        <form className={styles.addForm} onSubmit={addTask}>
          <button className={styles.closeComposer} type="button" aria-label="Đóng ô thêm việc" onClick={() => { setAddExpanded(false); setDraft(""); }}><X /></button>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Thêm đồ cần mang..." aria-label="Thêm đồ cần mang" maxLength={90} />
          <button type="submit" disabled={!draft.trim()}>Thêm</button>
        </form>
      </motion.div> : <motion.button className={styles.addFab} key="add-button" type="button" aria-label="Thêm đồ cần chuẩn bị" onClick={() => setAddExpanded(true)} initial={reduceMotion ? false : { opacity: 0, scale: .86 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .86 }} transition={{ duration: reduceMotion ? 0 : .16 }} whileTap={reduceMotion ? undefined : { scale: .92 }}><Plus /></motion.button>}
    </AnimatePresence>
    <nav className={styles.bottomNav} aria-label="Điều hướng chuyến đi">
      <button type="button" onClick={onHome}><Home aria-hidden="true" /><span>Trang chủ</span></button>
      <button type="button" onClick={onBack}><BriefcaseBusiness aria-hidden="true" /><span>Lịch trình</span></button>
      <button type="button" className={styles.activeNav} aria-current="page"><ClipboardCheck aria-hidden="true" /><span>Chuẩn bị</span></button>
      <button type="button" onClick={onReport}><ChartPie aria-hidden="true" /><span>Báo cáo</span></button>
    </nav>
    <AnimatePresence>{suggestionsOpen && <motion.div className={styles.drawerLayer} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .16 }} onClick={() => setSuggestionsOpen(false)}>
      <motion.aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="suggestion-title" initial={reduceMotion ? false : { y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 36 }} onClick={(event) => event.stopPropagation()}>
        <div className={styles.drawerHandle} />
        <div className={styles.drawerHeader}><div><span>Cẩm nang hành lý</span><h2 id="suggestion-title">{lastStop === firstStop ? "Gợi ý đồ cho " + firstStop : "Gợi ý đồ " + firstStop + " – " + lastStop}</h2></div><button type="button" aria-label="Đóng gợi ý" onClick={() => setSuggestionsOpen(false)}><X /></button></div>
        <div className={styles.suggestionList}>{suggestionGroups.map((group) => <section className={styles.suggestionGroup} key={group.zone}>
          <div className={styles.suggestionLabel}><i className={group.accent === "sage" ? styles.sageDot : styles.oceanDot} /><h3>{group.zone}</h3></div>
          <div className={styles.suggestionItems}>{group.items.map((title) => {
            const alreadyAdded = tasks.some((task) => task.title.trim().toLocaleLowerCase("vi") === title.toLocaleLowerCase("vi"));
            return <div className={styles.suggestionItem} key={title}><span>{title}</span><button type="button" disabled={alreadyAdded} onClick={() => addSuggestion(title)}>{alreadyAdded ? "Đã thêm" : "+ Thêm"}</button></div>;
          })}</div>
        </section>)}</div>
      </motion.aside>
    </motion.div>}</AnimatePresence>
    <AnimatePresence>{undoLabel && <motion.div className={styles.undoToast} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}><span>{undoLabel}</span>{canUndo && <button type="button" onClick={undoDelete}>Hoàn tác</button>}</motion.div>}</AnimatePresence>
  </main>;
}
