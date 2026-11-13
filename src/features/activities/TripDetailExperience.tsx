import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Banknote, BedDouble, Bike, CalendarCheck2, CalendarDays, Camera, Check, ChevronLeft, ClipboardCheck, Clock3, Coffee, Ellipsis, FileSpreadsheet, Fuel, Gift, HeartPulse, Home, LayoutGrid, Map, MapPin, Mountain, Palette, Pencil, Plane, Plus, Search, Shirt, ShoppingBag, Sparkles, Tent, Ticket, Trash2, Utensils, Wallet, ChartPie, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Trip, TripActivity, TripActivityStatus } from "../trips/data";
import { formatDong, tripRouteLabel } from "../trips/data";
import { deleteAttachment, readAttachment, saveAttachment } from "../media/storage";
import GlassCard from "../../ui/glass/GlassCard";
import GlassButton from "../../ui/glass/GlassButton";
import { GlassSheet } from "../../ui/sheets/GlassSheet";
import styles from "./TripDetailExperience.module.css";

type Props = { trip: Trip; onBack: () => void; onOpenPreparation: () => void; onOpenReport: () => void; onPhotoSelected: (photo: File) => void; onSaveActivity: (date: string, activity: TripActivity) => void; onDeleteActivity: (id: string) => void; onRenameActivityCategory: (typeId: string, previousName: string, name: string, group: string) => void; onExportTrip: () => void; onDeleteTrip: () => void; onNotify: (message: string) => void };
type SelectedDay = number | "all";
type CustomActivityType = { id: string; name: string; group: string; icon: string; color: string };
type FormValues = { name: string; location: string; address: string; time: string; category: string; categoryGroup: string; planned: string; actual: string; note: string; mapUrl: string; date: string; status: TripActivityStatus };
const defaultTypes = ["Ăn sáng", "Ăn trưa", "Ăn tối", "Ăn vặt / cafe", "Xăng / di chuyển", "Lưu trú", "Check-in / Khu du lịch", "Khác"];
const groups = ["Ăn uống", "Di chuyển", "Lưu trú", "Tham quan", "Mua sắm", "Giải trí", "Cà phê", "Khác"];
const quickTypeGroups: Record<string, string> = { "Ăn sáng": "Ăn uống", "Ăn trưa": "Ăn uống", "Ăn tối": "Ăn uống", "Ăn vặt / cafe": "Ăn uống", "Xăng / di chuyển": "Di chuyển", "Lưu trú": "Lưu trú", "Check-in / Khu du lịch": "Tham quan", "Khác": "Khác" };
const quickTypeIcons: Record<string, typeof LayoutGrid> = { "Ăn sáng": Utensils, "Ăn trưa": Utensils, "Ăn tối": Utensils, "Ăn vặt / cafe": Coffee, "Xăng / di chuyển": Fuel, "Lưu trú": BedDouble, "Check-in / Khu du lịch": Camera, "Khác": LayoutGrid };
const iconChoices = ["waves", "bike", "plane", "train", "camera", "gift", "heart", "sparkles", "fuel", "parking", "shirt", "money", "tent", "mountain", "music", "bookmark"];
const typeColorStyles: Record<string, string> = { "#18a899": "typeColor0", "#1687d2": "typeColor1", "#f2a328": "typeColor2", "#8b68ca": "typeColor3", "#e4689c": "typeColor4", "#4f9f6b": "typeColor6", "#6f79e8": "typeColor7", "#f5aa2c": "typeColor2" };
const typeColorOptions = [
  { color: "#18a899", label: "Xanh ngọc" }, { color: "#1687d2", label: "Xanh dương" },
  { color: "#f2a328", label: "Cam" }, { color: "#8b68ca", label: "Tím" },
  { color: "#e4689c", label: "Hồng" }, { color: "#4f9f6b", label: "Xanh lá" },
  { color: "#6f79e8", label: "Chàm" },
];
const typeStoreKey = "tripnote-v2-activity-types";
const blankForm = (date = ""): FormValues => ({ name: "", location: "", address: "", time: "", category: "Tham quan", categoryGroup: "Tham quan", planned: "", actual: "", note: "", mapUrl: "", date, status: "Dự kiến" });
const dateLabel = (date: string) => date ? new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`)) : "Chưa chọn ngày";
const formatMoneyInput = (value: string) => value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const moneyValue = (value: string) => value ? Number(value.replace(/\D/g, "")) : null;
const moneyText = (value: string) => value ? Number(value.replace(/\D/g, "")).toLocaleString("vi-VN") : "";
const inputDateLabel = (date: string) => { const [year, month, day] = date.split("-"); return `${day}/${month}/${year}`; };
const quickActivityTypes = ["Lưu trú", "Ăn uống", "Tham quan", "Di chuyển"];
const extendedTypeGroups = [
  { name: "Di chuyển & thủ tục", items: [{ name: "Vé máy bay / Tàu xe", icon: "plane", color: "#1687d2", group: "Di chuyển" }, { name: "Thuê xe máy / Ô tô", icon: "bike", color: "#18a899", group: "Di chuyển" }, { name: "Xăng xe & Đỗ xe", icon: "fuel", color: "#f2a328", group: "Di chuyển" }, { name: "Vé & Thủ tục", icon: "ticket", color: "#8b68ca", group: "Di chuyển" }] },
  { name: "Trải nghiệm & thư giãn", items: [{ name: "Sức khỏe & Spa", icon: "heart", color: "#e4689c", group: "Tham quan" }, { name: "Thể thao & Ngoài trời", icon: "mountain", color: "#4f9f6b", group: "Tham quan" }, { name: "Chụp ảnh & Check-in", icon: "camera", color: "#8b68ca", group: "Tham quan" }, { name: "Quà lưu niệm", icon: "gift", color: "#f2a328", group: "Mua sắm" }] },
  { name: "Tiện ích & chi phí khác", items: [{ name: "Giặt ủi & Tiện ích", icon: "shirt", color: "#1687d2", group: "Khác" }, { name: "Tiền tip & Phát sinh", icon: "money", color: "#4f9f6b", group: "Khác" }, { name: "Cắm trại & Dã ngoại", icon: "tent", color: "#18a899", group: "Tham quan" }, { name: "Hoạt động khác", icon: "sparkles", color: "#8b68ca", group: "Khác" }] },
];

function activityTypeIcon(type: string) {
  if (type === "Lưu trú") return <BedDouble />;
  if (type === "Ăn uống") return <Utensils />;
  if (type === "Tham quan") return <Camera />;
  return <Map />;
}

function categoryIcon(name: string) {
  const icons: Record<string, typeof LayoutGrid> = { plane: Plane, bike: Bike, fuel: Fuel, ticket: Ticket, heart: HeartPulse, mountain: Mountain, camera: Camera, gift: Gift, shirt: Shirt, money: Banknote, tent: Tent, sparkles: Sparkles, parking: MapPin, train: Map, waves: Map, bookmark: Map };
  const Icon = icons[name] ?? LayoutGrid;
  return <Icon />;
}

function activityCostSummary(planned: number | null | undefined, actual: number | null | undefined) {
  const spent = actual ?? 0;
  const status = spent <= 0 ? "Chưa chi" : planned !== null && planned !== undefined && spent > planned ? "Vượt dự kiến" : planned === null || planned === undefined ? "Đã chi" : "Đúng ngân sách";
  const remaining = planned === null || planned === undefined ? null : planned - spent;
  return { spent, status, remaining, over: remaining !== null && remaining < 0 };
}

function readTypes(): CustomActivityType[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(typeStoreKey) ?? "[]");
    return Array.isArray(saved) ? saved.filter((item): item is CustomActivityType => Boolean(item && typeof item === "object" && "id" in item && "name" in item && "group" in item && "icon" in item && "color" in item)) : [];
  } catch { return []; }
}

export default function TripDetailExperience({ trip, onBack, onOpenPreparation, onOpenReport, onPhotoSelected, onSaveActivity, onDeleteActivity, onRenameActivityCategory, onExportTrip, onDeleteTrip, onNotify }: Props) {
  const reduced = useReducedMotion();
  const days = useMemo(() => trip.itinerary ?? [], [trip.itinerary]);
  const firstActivityDay = Math.max(0, days.findIndex((day) => day.activities.length));
  const [selectedDay, setSelectedDay] = useState<SelectedDay>("all");
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [activitySheet, setActivitySheet] = useState(false);
  const [activityTypeStep, setActivityTypeStep] = useState(true);
  const [customTypeStep, setCustomTypeStep] = useState(false);
  const [customTypeFormOpen, setCustomTypeFormOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [selected, setSelected] = useState<{ activity: TripActivity; date: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TripActivity | null>(null);
  const [tripMenuOpen, setTripMenuOpen] = useState(false);
  const [deleteTripConfirmOpen, setDeleteTripConfirmOpen] = useState(false);
  const [editing, setEditing] = useState<TripActivity | null>(null);
  const [values, setValues] = useState<FormValues>(() => blankForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savedImage, setSavedImage] = useState<{ id: string; url: string } | null>(null);
  const [photoViewerUrl, setPhotoViewerUrl] = useState<string | null>(null);
  const [editImage, setEditImage] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [customTypes, setCustomTypes] = useState(readTypes);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [typeDraft, setTypeDraft] = useState({ name: "", group: "Tham quan", icon: iconChoices[0]!, color: "#18a899" });
  const photoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const tripMenuRef = useRef<HTMLDivElement>(null);
  const selectedDayIndex = selectedDay === "all" ? firstActivityDay : selectedDay;
  const selectedDayData = days[selectedDayIndex];
  const currentPlannedCost = moneyValue(values.planned);
  const currentActualCost = moneyValue(values.actual) ?? 0;
  const currentCostSummary = activityCostSummary(currentPlannedCost, currentActualCost);
  const selectedCost = selected ? activityCostSummary(selected.activity.plannedCost ?? selected.activity.cost, selected.activity.actualCost) : null;
  const allActivities = days.flatMap((day) => day.activities);
  const actual = allActivities.reduce((total, item) => total + (item.actualCost ?? 0), 0);
  const planned = trip.estimate ?? allActivities.reduce((total, item) => total + (item.plannedCost ?? item.cost ?? 0), 0);
  const remaining = trip.estimate === null ? null : trip.estimate - actual;
  const progressPercent = trip.estimate && trip.estimate > 0 ? Math.min(100, Math.max(0, actual / trip.estimate * 100)) : 0;
  const visibleDays = selectedDay === "all" ? days : selectedDayData ? [selectedDayData] : [];

  useEffect(() => { try { localStorage.setItem(typeStoreKey, JSON.stringify(customTypes)); } catch { /* custom labels remain usable for this session */ } }, [customTypes]);
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    if (selected?.activity.attachmentId) void readAttachment(selected.activity.attachmentId).then((blob) => { if (blob && !cancelled) { url = URL.createObjectURL(blob); setSavedImage({ id: selected.activity.id, url }); } }).catch(() => undefined);
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [selected]);
  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);
  useEffect(() => {
    if (!tripMenuOpen) return;
    const closeOnOutside = (event: PointerEvent) => { if (event.target instanceof Node && !tripMenuRef.current?.contains(event.target)) setTripMenuOpen(false); };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [tripMenuOpen]);
  useEffect(() => {
    let url: string | null = null;
    if (editing?.attachmentId) void readAttachment(editing.attachmentId).then((blob) => { if (blob) { url = URL.createObjectURL(blob); setEditImage(url); } }).catch(() => undefined);
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [editing]);

  const openNew = (category?: string) => {
    setEditing(null); setImageFile(null); setImagePreview(null); setEditImage(null); setRemoveExistingImage(false); setPhotoError(""); setSaveError("");
    setValues({ ...blankForm(selectedDayData?.date ?? days[0]?.date ?? ""), ...(category ? { category, categoryGroup: customTypes.find((item) => item.name === category)?.group ?? category } : {}) });
    setActivityTypeStep(!category); setCustomTypeStep(false); setCustomTypeFormOpen(false); setEditingTypeId(null); setActivitySheet(true);
  };
  const openEdit = () => {
    if (!selected) return;
    const item = selected.activity;
    setEditing(item); setImageFile(null); setImagePreview(null); setEditImage(null); setRemoveExistingImage(false); setPhotoError(""); setSaveError("");
    const plannedCost = item.plannedCost ?? item.cost;
    setValues({ ...blankForm(selected.date), name: item.name, location: item.location, address: item.address ?? "", time: item.time, category: item.category || "Khác", categoryGroup: item.categoryGroup ?? item.category ?? "Khác", planned: plannedCost === null || plannedCost === undefined ? "" : String(plannedCost), actual: item.actualCost === null || item.actualCost === undefined ? "" : String(item.actualCost), note: item.note ?? "", mapUrl: item.mapUrl ?? "", status: item.status });
    setSelected(null); setActivityTypeStep(false); setCustomTypeStep(false); setCustomTypeFormOpen(false); setEditingTypeId(null); setActivitySheet(true);
  };
  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Vui lòng chọn tệp ảnh hợp lệ."); return; }
    if (file.size > 10 * 1024 * 1024) { setPhotoError("Ảnh phải nhỏ hơn 10 MB."); return; }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file); setImagePreview(URL.createObjectURL(file)); setRemoveExistingImage(false); setPhotoError("");
  };
  const saveActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!values.name.trim() || !values.date || savingRef.current) return;
    savingRef.current = true; setSaving(true); setSaveError("");
    try {
      const attachmentId = imageFile ? await saveAttachment(imageFile) : removeExistingImage ? undefined : editing?.attachmentId;
      if (removeExistingImage && editing?.attachmentId) await deleteAttachment(editing.attachmentId);
      const plannedValue = moneyValue(values.planned);
      const actualValue = moneyValue(values.actual);
      const matchedCustomType = customTypes.find((item) => item.name === values.category);
      const activity: TripActivity = { id: editing?.id ?? `activity-${crypto.randomUUID()}`, name: values.name.trim(), location: values.location.trim(), address: values.address.trim() || undefined, time: values.time, category: values.category, categoryGroup: values.categoryGroup, customTypeId: matchedCustomType?.id, cost: plannedValue, plannedCost: plannedValue, actualCost: actualValue, note: values.note.trim() || undefined, mapUrl: values.mapUrl.trim() || undefined, attachmentId, status: values.status };
      onSaveActivity(values.date, activity);
      onNotify(editing ? "Đã lưu thay đổi hoạt động" : "Đã thêm hoạt động vào lịch trình");
      setActivitySheet(false); setEditing(null); setValues(blankForm()); setImageFile(null); setImagePreview(null); setEditImage(null);
    } catch { setSaveError("Không thể lưu hoạt động. Vui lòng thử lại."); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const createCustomType = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = typeDraft.name.trim();
    if (!name || defaultTypes.includes(name) || customTypes.some((item) => item.id !== editingTypeId && item.name.toLocaleLowerCase("vi") === name.toLocaleLowerCase("vi"))) return;
    const previous = editingTypeId ? customTypes.find((item) => item.id === editingTypeId) : undefined;
    const created = { ...typeDraft, id: editingTypeId ?? `custom-${crypto.randomUUID()}`, name };
    setCustomTypes((current) => previous ? current.map((item) => item.id === created.id ? created : item) : [...current, created]);
    if (previous && (previous.name !== name || previous.group !== created.group)) onRenameActivityCategory(previous.id, previous.name, name, created.group);
    setValues((current) => ({ ...current, category: created.name, categoryGroup: created.group }));
    setTypeDraft({ name: "", group: "Tham quan", icon: iconChoices[0]!, color: "#18a899" });
    setEditingTypeId(null);
    setCustomTypeFormOpen(false); setCustomTypeStep(false); setActivityTypeStep(false);
    onNotify(previous ? "Đã cập nhật danh mục hoạt động" : "Đã tạo danh mục hoạt động");
  };
  const removeCustomType = (type: CustomActivityType) => {
    onRenameActivityCategory(type.id, type.name, "", "");
    setCustomTypes((current) => current.filter((item) => item.id !== type.id));
  };
  const typePickerContent = activityTypeStep ? customTypeStep ? <div className={styles.customTypePanel}>
    {customTypeFormOpen ? <>
      <button className={styles.backToTypes} type="button" onClick={() => { setCustomTypeFormOpen(false); setEditingTypeId(null); }}><ChevronLeft />Các loại đã tạo</button>
      <form className={styles.typeForm} onSubmit={createCustomType}>
        <label>{editingTypeId ? "Sửa loại" : "Tên loại mới"}<input required maxLength={30} value={typeDraft.name} onChange={(event) => setTypeDraft({ ...typeDraft, name: event.target.value })} placeholder="Ví dụ: Chụp ảnh" /></label>
        <label>Nhóm báo cáo<select value={typeDraft.group} onChange={(event) => setTypeDraft({ ...typeDraft, group: event.target.value })}>{groups.map((group) => <option key={group}>{group}</option>)}</select></label>
        <div className={styles.customTypePreview}><span className={styles[typeColorStyles[typeDraft.color] ?? "typeColor0"]} style={{ backgroundColor: typeDraft.color }}>{categoryIcon(typeDraft.icon)}</span><div><small>Xem trước thẻ</small><strong>{typeDraft.name || "Tên danh mục"}</strong></div><i>{typeDraft.group}</i></div>
        <label className={styles.choiceLabel}>Biểu tượng</label><div className={styles.iconChoices} aria-label="Chọn biểu tượng">{iconChoices.map((icon) => <button key={icon} type="button" aria-label={`Biểu tượng ${icon}`} aria-pressed={typeDraft.icon === icon} onClick={() => setTypeDraft({ ...typeDraft, icon })}>{categoryIcon(icon)}</button>)}</div>
        <label className={styles.choiceLabel}>Bảng màu</label><div className={styles.typeColors} aria-label="Bảng màu">{typeColorOptions.map(({ color, label }) => <button key={color} type="button" aria-label={`Chọn màu ${label}`} aria-pressed={typeDraft.color === color || (color === "#f2a328" && typeDraft.color === "#f5aa2c")} onClick={() => setTypeDraft({ ...typeDraft, color })}><span className={`${styles.colorSwatch} ${styles[typeColorStyles[color]!]}`} /><small>{label}</small>{(typeDraft.color === color || (color === "#f2a328" && typeDraft.color === "#f5aa2c")) && <Check />}</button>)}<label className={styles.customColorChoice}><input type="color" aria-label="Chọn màu tùy chỉnh" value={typeDraft.color} onChange={(event) => setTypeDraft({ ...typeDraft, color: event.target.value })} /><span style={{ backgroundColor: typeDraft.color }} aria-hidden="true"><Palette /></span><small>Màu tùy chỉnh</small></label></div>
        <div className={styles.typeFormActions}><button type="button" onClick={() => { setCustomTypeFormOpen(false); setEditingTypeId(null); }}>Hủy</button><button className={styles.save} type="submit">{editingTypeId ? "Lưu thay đổi" : "Tạo loại mới"}</button></div>
      </form>
    </> : <>
      <div className={styles.expandedTypeHeader}><button className={styles.backToTypes} type="button" onClick={() => { setCustomTypeStep(false); setCategoryQuery(""); }}><ChevronLeft />Quay lại loại nhanh</button></div>
      <label className={styles.categorySearch}><Search /><input value={categoryQuery} onChange={(event) => setCategoryQuery(event.target.value)} placeholder="Tìm danh mục hoạt động..." /></label>
      <div className={styles.expandedTypeList}>
        {customTypes.length > 0 && (!categoryQuery || customTypes.some((type) => type.name.toLocaleLowerCase("vi").includes(categoryQuery.toLocaleLowerCase("vi")))) && <section className={styles.expandedTypeGroup}><h3>Danh mục của tôi</h3><div>{customTypes.filter((type) => type.name.toLocaleLowerCase("vi").includes(categoryQuery.toLocaleLowerCase("vi"))).map((type) => <article className={styles.customTypeItem} key={type.id}><button type="button" aria-label={`Chỉnh sửa ${type.name}`} onClick={() => { setEditingTypeId(type.id); setTypeDraft({ name: type.name, group: type.group, icon: type.icon, color: type.color }); setCustomTypeFormOpen(true); }}><span className={styles[typeColorStyles[type.color] ?? "typeColor0"]} style={{ backgroundColor: type.color }}>{categoryIcon(type.icon)}</span><span className={styles.customTypeLabel}><strong>{type.name}</strong><small>{type.group}</small></span></button><button className={styles.deleteTypeButton} type="button" title={`Xóa ${type.name}`} aria-label={`Xóa loại ${type.name}`} onClick={() => removeCustomType(type)}><X /></button></article>)}</div></section>}
        {extendedTypeGroups.map((group) => { const items = group.items.filter((item) => item.name.toLocaleLowerCase("vi").includes(categoryQuery.toLocaleLowerCase("vi"))); return items.length ? <section className={styles.expandedTypeGroup} key={group.name}><h3>{group.name}</h3><div>{items.map((item) => <button type="button" className={styles[`categoryTone${item.color === "#1687d2" ? "Sky" : item.color === "#18a899" ? "Teal" : item.color === "#f2a328" ? "Orange" : item.color === "#e4689c" ? "Pink" : item.color === "#4f9f6b" ? "Green" : "Purple"}`]} key={item.name} onClick={() => { setValues((current) => ({ ...current, category: item.name, categoryGroup: item.group })); setActivityTypeStep(false); setCustomTypeStep(false); }}><span>{categoryIcon(item.icon)}</span><span className={styles.categoryLabel}>{item.name}</span></button>)}</div></section> : null; })}
        {!customTypes.some((type) => type.name.toLocaleLowerCase("vi").includes(categoryQuery.toLocaleLowerCase("vi"))) && !extendedTypeGroups.some((group) => group.items.some((item) => item.name.toLocaleLowerCase("vi").includes(categoryQuery.toLocaleLowerCase("vi")))) && <p className={styles.emptyTypes}>Không tìm thấy danh mục phù hợp.</p>}
      </div>
      <div className={styles.expandedTypeFooter}><button className={styles.createTypeButton} type="button" onClick={() => { setEditingTypeId(null); setTypeDraft({ name: "", group: "Tham quan", icon: iconChoices[0]!, color: "#18a899" }); setCustomTypeFormOpen(true); }}><Plus />Tạo danh mục mới</button></div>
    </>}
  </div> : <div className={styles.quickTypeGrid}>{defaultTypes.map((type) => { const Icon = quickTypeIcons[type] ?? LayoutGrid; return <button type="button" key={type} onClick={() => { setValues((current) => ({ ...current, category: type, categoryGroup: quickTypeGroups[type] ?? "Khác" })); setActivityTypeStep(false); }}><span><Icon /></span>{type}</button>; })}<button type="button" onClick={() => { setCategoryQuery(""); setCustomTypeStep(true); setCustomTypeFormOpen(false); }}><span><Sparkles /></span>Xem thêm<ChevronLeft className={styles.otherArrow} /></button></div> : null;

  const renderDay = (day: NonNullable<Trip["itinerary"]>[number], dayIndex: number) => {
    const activities = day.activities;
    const dayBudget = day.expectedBudget ?? activities.reduce((sum, item) => sum + (item.plannedCost ?? item.cost ?? 0), 0);
    const daySpent = activities.reduce((sum, item) => sum + (item.actualCost ?? 0), 0);
    const dayHasOverspend = daySpent > dayBudget || activities.some((item) => activityCostSummary(item.plannedCost ?? item.cost, item.actualCost).over);
    return <motion.section className={styles.daySection} key={day.date} initial={reduced ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.dateLine}><span><CalendarCheck2 /></span><strong>{dateLabel(day.date)}</strong>{day.destination && <em className={styles.dayDestination}><MapPin />{day.destination}</em>}<small className={dayHasOverspend ? styles.dayCostOver : ""}><span>• Dự kiến: {formatDong(dayBudget)}</span>{daySpent > 0 && <span>• Đã chi: {formatDong(daySpent)}</span>}</small></div>
      {activities.length ? <div className={styles.timeline}>{activities.map((activity) => <button type="button" className={styles.activity} key={activity.id} onClick={() => setSelected({ activity, date: day.date })}>
        <span className={`${styles.categoryIcon} ${activity.category.toLocaleLowerCase("vi").includes("ăn") ? styles.food : ""}`}>{activity.category.toLocaleLowerCase("vi").includes("ăn") ? <Utensils /> : activity.categoryGroup === "Mua sắm" ? <ShoppingBag /> : <MapPin />}</span>
        <span className={styles.activityInfo}><strong>{activity.name}</strong><span><MapPin />{activity.location || activity.address || activity.category}</span><small><Clock3 />{activity.time || "Chưa chọn giờ"}<i>•</i>{activity.category}</small></span>
        {(() => { const cost = activityCostSummary(activity.plannedCost ?? activity.cost, activity.actualCost); const label = cost.spent > 0 ? cost.remaining === null ? "Đã chi" : cost.over ? `Vượt +${formatDong(Math.abs(cost.remaining))}` : cost.remaining > 0 ? `Còn dư ${formatDong(cost.remaining)}` : "Đúng ngân sách" : activity.status; const statusClass = cost.spent > 0 ? cost.over ? styles.costOverText : styles.costOkText : activity.status === "Đã hoàn thành" ? styles.completed : activity.status === "Đã hủy" ? styles.cancelled : activity.status === "Đã lên kế hoạch" ? styles.plannedStatus : styles.pending; return <span className={styles.activityCost}><strong className={cost.over ? styles.activityCostAmountOver : ""}>{formatDong(activity.actualCost ?? activity.plannedCost ?? activity.cost ?? 0)}</strong><small className={statusClass}>{label}</small></span>; })()}
      </button>)}</div> : <GlassCard className={styles.empty}>Ngày {dayIndex + 1} chưa có hoạt động. Thêm hoạt động để bắt đầu lên kế hoạch.</GlassCard>}
    </motion.section>;
  };

  const editFormContent = <form className={styles.activityEditForm} onSubmit={(event) => void saveActivity(event)}>
    <label className={`${styles.editField} ${styles.required}`}>Tên hoạt động<input required value={values.name} maxLength={80} placeholder="Tên hoạt động" onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
    <div className={styles.editFieldGrid}>
      <label className={`${styles.editField} ${styles.required}`}>Ngày<input required type="date" value={values.date} onChange={(event) => setValues({ ...values, date: event.target.value })} /></label>
      <label className={`${styles.editField} ${styles.required}`}>Thời gian<input type="time" value={values.time} onChange={(event) => setValues({ ...values, time: event.target.value })} /></label>
    </div>
    <label className={styles.editField}>Địa điểm<input value={values.location} placeholder="Tên địa điểm" onChange={(event) => setValues({ ...values, location: event.target.value })} /></label>
    <fieldset className={styles.editCategoryField}><legend>Loại hoạt động</legend><div>{quickActivityTypes.map((type) => <button key={type} type="button" aria-pressed={values.categoryGroup === type || values.category === type} onClick={() => setValues((current) => ({ ...current, category: type, categoryGroup: type }))}><span>{activityTypeIcon(type)}</span>{type}</button>)}{!quickActivityTypes.includes(values.category) && <button type="button" aria-pressed="true" onClick={() => { setActivityTypeStep(true); setCustomTypeStep(false); }}><span>{activityTypeIcon(values.category)}</span>{values.category}</button>}<button type="button" className={styles.moreTypes} onClick={() => { setActivityTypeStep(true); setCustomTypeStep(false); }}>Loại khác</button></div></fieldset>
    <div className={styles.editFieldGrid}>
      <label className={styles.editField}>Dự kiến (đ)<input inputMode="numeric" value={moneyText(values.planned)} placeholder="0" onChange={(event) => setValues({ ...values, planned: formatMoneyInput(event.target.value) })} /></label>
      <label className={styles.editField}>Đã chi (đ)<input inputMode="numeric" value={moneyText(values.actual)} placeholder="0" onChange={(event) => setValues({ ...values, actual: formatMoneyInput(event.target.value) })} /></label>
    </div>
    <div className={`${styles.editCostStatus} ${currentCostSummary.over ? styles.editCostOver : currentActualCost > 0 ? styles.editCostOk : styles.editCostUnpaid}`}><span>Trạng thái chi phí:</span>{currentCostSummary.remaining !== null && currentActualCost > 0 && <small>{currentCostSummary.over ? `Vượt +${formatDong(Math.abs(currentCostSummary.remaining))}` : `Còn dư ${formatDong(currentCostSummary.remaining)}`}</small>}<strong><i />{currentCostSummary.status}</strong></div>
    <details className={styles.editMoreFields}><summary>Thông tin bổ sung</summary><div>
      <label className={styles.editField}>Địa chỉ<input value={values.address} placeholder="Địa chỉ cụ thể" onChange={(event) => setValues({ ...values, address: event.target.value })} /></label>
      <label className={styles.editField}>Ghi chú<textarea rows={2} value={values.note} placeholder="Thêm ghi chú" onChange={(event) => setValues({ ...values, note: event.target.value })} /></label>
      <label className={styles.editField}>Google Maps<input type="url" value={values.mapUrl} placeholder="https://maps.google.com/..." onChange={(event) => setValues({ ...values, mapUrl: event.target.value })} /></label>
      <input ref={photoInput} className={styles.hidden} type="file" accept="image/*" capture="environment" onChange={handleImage} />
      <div className={styles.photoRow}><button className={styles.photoButton} type="button" onClick={() => photoInput.current?.click()}><Camera />{imageFile ? "Thay ảnh" : (imagePreview || editImage) ? "Đổi ảnh" : "Đính kèm ảnh"}</button>{(imagePreview || editImage) && <button className={styles.removePhoto} type="button" onClick={() => { if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); setImageFile(null); setRemoveExistingImage(true); }}><X />Xóa ảnh</button>}</div>
      {(imagePreview || editImage) && <button className={styles.previewButton} type="button" onClick={() => setPhotoViewerUrl(imagePreview ?? editImage!)}><img className={styles.preview} src={imagePreview ?? editImage!} alt="Ảnh đính kèm" />Chạm để xem ảnh</button>}
    </div></details>
    {photoError && <p className={styles.error} role="alert">{photoError}</p>}{saveError && <p className={styles.error} role="alert">{saveError}</p>}
    <div className={styles.editFooter}><GlassButton type="submit" variant="primary" className={styles.save} disabled={saving}><Check />{saving ? "Đang lưu…" : "Lưu thay đổi"}</GlassButton></div>
  </form>;

  const createActivityContent = <form className={styles.activityCreateForm} onSubmit={(event) => void saveActivity(event)}>
    <div className={styles.createCategoryBadge}><span>{activityTypeIcon(values.categoryGroup)}</span><strong>{values.category}</strong><small>· {dateLabel(values.date)}</small><button type="button" onClick={() => { setCustomTypeStep(false); setActivityTypeStep(true); }} aria-label="Đổi loại hoạt động">Đổi</button></div>
    <label className={`${styles.editField} ${styles.required}`}>Tên hoạt động<input required value={values.name} maxLength={80} placeholder={`Ví dụ: ${values.category === "Lưu trú" ? "Nhận phòng khách sạn" : values.category === "Ăn uống" ? "Ăn tối lẩu gà lá é" : values.category === "Di chuyển" ? "Di chuyển sang điểm tiếp theo" : "Tham quan hồ Xuân Hương"}`} onChange={(event) => setValues({ ...values, name: event.target.value })} /></label>
    <div className={styles.editFieldGrid}><label className={`${styles.editField} ${styles.required}`}>Ngày<input required type="date" value={values.date} onChange={(event) => setValues({ ...values, date: event.target.value })} /></label><label className={styles.editField}>Thời gian<input type="time" value={values.time} onChange={(event) => setValues({ ...values, time: event.target.value })} /></label></div>
    <label className={styles.editField}>Địa điểm<input value={values.location} placeholder="Tên địa điểm hoặc địa chỉ" onChange={(event) => setValues({ ...values, location: event.target.value })} /></label>
    <section className={styles.createCostSection}><header><strong>Chi phí</strong><span className={`${styles.createCostBadge} ${currentActualCost > 0 ? currentCostSummary.over ? styles.editCostOver : styles.editCostOk : currentPlannedCost ? styles.editCostUnpaid : ""}`}><i />{currentPlannedCost === 0 && currentActualCost === 0 ? "Dự kiến" : currentCostSummary.status}</span></header><div className={styles.editFieldGrid}><label className={styles.editField}>Dự kiến (đ)<input inputMode="numeric" value={moneyText(values.planned)} placeholder="0" onChange={(event) => setValues({ ...values, planned: formatMoneyInput(event.target.value) })} /></label><label className={styles.editField}>Đã chi (đ)<input inputMode="numeric" value={moneyText(values.actual)} placeholder="0" onChange={(event) => setValues({ ...values, actual: formatMoneyInput(event.target.value) })} /></label></div>{currentActualCost > 0 && currentCostSummary.remaining !== null && <small className={currentCostSummary.over ? styles.costOverText : styles.costOkText}>{currentCostSummary.over ? `Vượt ${formatDong(Math.abs(currentCostSummary.remaining))}` : `Còn dư ${formatDong(currentCostSummary.remaining)}`}</small>}</section>
    <details className={styles.editMoreFields}><summary>Thông tin bổ sung</summary><div>
      <label className={styles.editField}>Địa chỉ<input value={values.address} placeholder="Địa chỉ cụ thể" onChange={(event) => setValues({ ...values, address: event.target.value })} /></label>
      <label className={styles.editField}>Ghi chú<textarea rows={2} value={values.note} placeholder="Thêm ghi chú" onChange={(event) => setValues({ ...values, note: event.target.value })} /></label>
      <label className={styles.editField}>Google Maps<input type="url" value={values.mapUrl} placeholder="https://maps.google.com/..." onChange={(event) => setValues({ ...values, mapUrl: event.target.value })} /></label>
      <input ref={photoInput} className={styles.hidden} type="file" accept="image/*" capture="environment" onChange={handleImage} />
      <div className={styles.photoRow}><button className={styles.photoButton} type="button" onClick={() => photoInput.current?.click()}><Camera />{imageFile ? "Thay ảnh" : imagePreview ? "Đổi ảnh" : "Đính kèm ảnh"}</button>{imagePreview && <button className={styles.removePhoto} type="button" onClick={() => { URL.revokeObjectURL(imagePreview); setImagePreview(null); setImageFile(null); }}>Xóa ảnh</button>}</div>
      {imagePreview && <button className={styles.previewButton} type="button" onClick={() => setPhotoViewerUrl(imagePreview)}><img className={styles.preview} src={imagePreview} alt="Ảnh hoạt động" />Chạm để xem ảnh</button>}
    </div></details>
    {photoError && <p className={styles.error} role="alert">{photoError}</p>}{saveError && <p className={styles.error} role="alert">{saveError}</p>}
    <div className={styles.editFooter}><GlassButton type="submit" variant="primary" className={styles.save} disabled={saving}><Plus />{saving ? "Đang lưu…" : "Thêm vào lịch trình"}</GlassButton></div>
  </form>;

  return <motion.main className={styles.page} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .2, ease: [.22, 1, .36, 1] }}>
    <header className={styles.hero}>
      {trip.image && <img className={styles.cover} src={trip.image} alt="" />}<span className={styles.coverShade} />
      <button className={styles.back} type="button" aria-label="Quay lại" onClick={onBack}><ArrowLeft /></button><button className={styles.coverEdit} type="button" aria-label="Cập nhật ảnh chuyến đi" onClick={() => coverInput.current?.click()}><Camera /></button>
      <input ref={coverInput} className={styles.hidden} type="file" accept="image/*" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) onPhotoSelected(file); event.currentTarget.value = ""; }} />
      <div className={styles.heroCopy}><span><MapPin />{tripRouteLabel(trip)}</span><p><CalendarDaysIcon />{trip.dateRange}<i>·</i>{days.length} ngày</p></div><div className={styles.tripMenuAnchor} ref={tripMenuRef}><button type="button" className={styles.more} aria-label="Tùy chọn chuyến đi" aria-expanded={tripMenuOpen} onClick={() => setTripMenuOpen((open) => !open)}><Ellipsis /></button>
      {tripMenuOpen && <div className={styles.tripMenu} role="menu"><button type="button" role="menuitem" onClick={() => { setTripMenuOpen(false); onExportTrip(); }}><FileSpreadsheet />Xuất Excel</button><button type="button" role="menuitem" onClick={() => { setTripMenuOpen(false); setDeleteTripConfirmOpen(true); }}><Trash2 />Xóa chuyến đi</button></div>}</div>
    </header>
    <section className={styles.overview} aria-label="Tổng quan ngân sách">
      <GlassCard className={styles.budget}><div className={styles.budgetRing} aria-label={`${Math.round(progressPercent)}% ngân sách đã sử dụng`}><svg viewBox="0 0 48 48"><circle className={styles.ringTrack} cx="24" cy="24" r="20" />{progressPercent > 0 && <circle className={styles.ringValue} cx="24" cy="24" r="20" strokeDasharray={`${progressPercent * 1.2566} 125.66`} />}</svg><span>{Math.round(progressPercent)}%</span></div>
        <div className={styles.budgetPrimary}><strong>{trip.estimate === null ? formatDong(planned) : formatDong(trip.estimate)}</strong><small>Còn lại trong ngân sách</small><span>{remaining === null ? "Chưa thiết lập ngân sách" : formatDong(remaining)}</span></div><div className={`${styles.budgetSpent} ${(remaining !== null && remaining < 0) ? styles.budgetSpentOver : ""}`}><small><i />Đã chi</small><strong>{formatDong(actual)}</strong><button type="button" aria-label="Mở báo cáo" onClick={onOpenReport}><Wallet /></button></div>
      </GlassCard>
    </section>
    <section className={styles.itinerary}>
      <div className={styles.dayControls}><span className={styles.dayLabel}>{selectedDay === "all" ? "Tất cả ngày" : `Ngày ${selectedDayIndex + 1} · ${selectedDayData ? dateLabel(selectedDayData.date).replace(/^\S+\s/, "") : ""}`}</span><button type="button" className={styles.dayPickerButton} aria-label="Chọn ngày" aria-expanded={dayPickerOpen} onClick={() => setDayPickerOpen((open) => !open)}><CalendarDays /></button></div>
      {dayPickerOpen && <div className={styles.dayDropdown} aria-label="Chọn ngày lịch trình"><button type="button" aria-pressed={selectedDay === "all"} onClick={() => { setSelectedDay("all"); setDayPickerOpen(false); }}>Tất cả ngày<small>{allActivities.length} hoạt động</small></button>{days.map((day, index) => <button type="button" aria-pressed={selectedDay === index} key={day.date} onClick={() => { setSelectedDay(index); setDayPickerOpen(false); }}>Ngày {index + 1} · {dateLabel(day.date)}<small>{day.destination || "Chưa có điểm dừng"} · {day.activities.length} hoạt động</small></button>)}</div>}
      {allActivities.length === 0 ? <GlassCard className={styles.empty}>Chưa có dữ liệu lịch trình. Thêm hoạt động để bắt đầu kế hoạch chuyến đi.</GlassCard> : visibleDays.filter((day) => selectedDay !== "all" || day.activities.length > 0).map((day) => renderDay(day, days.indexOf(day)))}
    </section>
    <button className={styles.addButton} type="button" aria-label="Thêm hoạt động" onClick={() => openNew()}><Plus /></button>
    <nav className={styles.bottomNav} aria-label="Điều hướng chuyến đi"><button type="button" onClick={onBack}><Home aria-hidden="true" /><span>Trang chủ</span></button><button type="button" aria-current="page" className={styles.activeNav}><CalendarDays aria-hidden="true" /><span>Lịch trình</span></button><button type="button" onClick={onOpenPreparation}><ClipboardCheck aria-hidden="true" /><span>Chuẩn bị</span></button><button type="button" onClick={onOpenReport}><ChartPie aria-hidden="true" /><span>Báo cáo</span></button></nav>

    {activitySheet && <GlassSheet title={editing ? "Chỉnh sửa hoạt động" : activityTypeStep ? customTypeStep ? customTypeFormOpen ? editingTypeId ? "Chỉnh sửa danh mục" : "Tạo danh mục mới" : "Tất cả danh mục" : "Thêm hoạt động" : "Thêm hoạt động"} subtitle={editing ? "Cập nhật thông tin trong lịch trình" : activityTypeStep ? customTypeStep ? customTypeFormOpen ? editingTypeId ? "Cập nhật tên, nhóm và màu sắc" : "Chọn nhanh hoặc tự tạo danh mục riêng" : "Chọn nhanh hoặc tự tạo danh mục riêng" : "Chọn loại hoạt động cho điểm dừng mới" : `${values.category} · ${dateLabel(values.date)}`} icon={editing ? <Pencil /> : activityTypeStep ? customTypeFormOpen ? <Sparkles /> : customTypeStep ? <LayoutGrid /> : <Plus /> : activityTypeIcon(values.categoryGroup)} variant="sheet" className={editing ? styles.activityEditSheet : styles.activityCreateSheet} onClose={() => { setActivitySheet(false); setEditing(null); setImagePreview(null); setEditImage(null); setCustomTypeFormOpen(false); setEditingTypeId(null); setCategoryQuery(""); }}>
      {activityTypeStep ? typePickerContent : editing ? editFormContent : createActivityContent}
    </GlassSheet>}
    {selected && selectedCost && <GlassSheet title={selected.activity.name} subtitle={`${selected.activity.category} · ${inputDateLabel(selected.date)}`} icon={activityTypeIcon(selected.activity.categoryGroup ?? selected.activity.category)} variant="sheet" className={styles.activityViewSheet} onClose={() => setSelected(null)}><div className={styles.activityDetail}>{savedImage?.id === selected.activity.id && <img src={savedImage.url} alt={`Ảnh ${selected.activity.name}`} />}<div className={styles.detailMetric}><span><Clock3 /></span><small>Thời gian</small><strong>{selected.activity.time || "Chưa đặt giờ"}</strong></div><div className={styles.detailMetric}><span><MapPin /></span><small>Địa điểm</small><strong>{selected.activity.location || selected.activity.address || "Chưa thêm địa điểm"}</strong></div><section className={styles.detailCostCard}><header><span><Wallet />Chi phí</span><strong className={`${styles.costBadge} ${selectedCost.over ? styles.costBadgeOver : selectedCost.spent > 0 ? styles.costBadgeOk : styles.costBadgeUnpaid}`}><i />{selectedCost.status}</strong></header><div className={styles.detailCostValues}>{selectedCost.spent > 0 ? <><div><small>Đã chi</small><strong>{formatDong(selectedCost.spent)}</strong></div><div className={styles.detailCostExpected}><small>Dự kiến: {selected.activity.plannedCost ?? selected.activity.cost ? formatDong(selected.activity.plannedCost ?? selected.activity.cost ?? 0) : "Chưa đặt"}</small>{selectedCost.remaining !== null && <em className={selectedCost.over ? styles.costOverText : styles.costOkText}>{selectedCost.over ? `Vượt +${formatDong(Math.abs(selectedCost.remaining))}` : `Còn dư ${formatDong(selectedCost.remaining)}`}</em>}</div></> : <><div><small>Dự kiến</small><strong>{selected.activity.plannedCost === null && selected.activity.cost === null ? "Chưa đặt" : formatDong(selected.activity.plannedCost ?? selected.activity.cost ?? 0)}</strong></div><div><small>Đã chi</small><strong>{formatDong(selectedCost.spent)}</strong></div></>}</div></section>{selected.activity.note && <p className={styles.detailNote}>{selected.activity.note}</p>}{selected.activity.mapUrl && <a className={styles.detailMapLink} href={selected.activity.mapUrl} target="_blank" rel="noreferrer"><Map />Mở bản đồ</a>}<div className={styles.detailActions}><GlassButton variant="primary" onClick={openEdit}><Pencil />Sửa hoạt động</GlassButton><button type="button" onClick={() => { setDeleteTarget(selected.activity); setSelected(null); }}><Trash2 />Xóa hoạt động</button></div></div></GlassSheet>}
    {deleteTarget && <GlassSheet title="Xóa hoạt động?" subtitle="Bạn có thể thêm hoạt động này lại sau." icon={<Trash2 />} variant="sheet" onClose={() => setDeleteTarget(null)}><div className={styles.deleteConfirm}><p>Bạn chắc chắn muốn xóa <strong>{deleteTarget.name}</strong> khỏi lịch trình chứ?</p><div><button type="button" onClick={() => setDeleteTarget(null)}>Giữ hoạt động</button><button type="button" onClick={() => { onDeleteActivity(deleteTarget.id); setDeleteTarget(null); }}>Xóa hoạt động</button></div></div></GlassSheet>}
    {deleteTripConfirmOpen && <GlassSheet title="Xóa chuyến đi?" subtitle="Toàn bộ lịch trình và hoạt động trong chuyến đi này sẽ bị xóa." icon={<Trash2 />} variant="sheet" onClose={() => setDeleteTripConfirmOpen(false)}><div className={styles.deleteConfirm}><p>Bạn chắc chắn muốn xóa <strong>{tripRouteLabel(trip)}</strong> chứ?</p><div><button type="button" onClick={() => setDeleteTripConfirmOpen(false)}>Giữ chuyến đi</button><button type="button" onClick={() => { setDeleteTripConfirmOpen(false); onDeleteTrip(); }}>Xóa chuyến đi</button></div></div></GlassSheet>}
    {photoViewerUrl && <GlassSheet title="Ảnh đính kèm" onClose={() => setPhotoViewerUrl(null)}><img className={styles.largePreview} src={photoViewerUrl} alt="Ảnh phóng to" /></GlassSheet>}
  </motion.main>;
}

function CalendarDaysIcon() { return <CalendarCheck2 />; }
