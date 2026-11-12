import { CalendarDays, Check, ChevronLeft, ChevronRight, ImagePlus, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { DashboardSection } from "../../ui/navigation/types";
import { GlassSheet } from "../../ui/sheets/GlassSheet";
import DashboardExperience from "../../features/dashboard/DashboardExperience";
import TripDetailExperience from "../TripDetail";
import { type Trip, type TripActivity, type TripDay, type TripDestination, type TripPreparationTask } from "../../features/trips/data";
import { loadTrips, saveTrips } from "../../features/trips/storage";
import { readAttachment, saveAttachment } from "../../features/media/storage";
import { exportTripWorkbook, parseTripWorkbook, type ImportPreview } from "../../features/excel/workbook";
import ImportExcelDialog from "../../features/excel/ImportExcelDialog";
import TripPreparationPage from "../../features/trips/TripPreparationPage";
import TripReportPage from "../Report";
import styles from "./Dashboard.module.css";

type DialogState = "new" | "date" | null;
type DatePickerTarget = "start" | "end";

const toLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return value ? new Date(year!, month! - 1, day!, 12) : new Date();
};
const toDateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const displayDateValue = (value: string) => value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(toLocalDate(value)) : "dd/mm/yyyy";
const calendarGrid = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - mondayOffset + 1, 12));
};

function formatDateLabel(date: string) {
  if (!date) return "";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function buildTripDays(startDate: string, endDate: string): TripDay[] {
  if (!startDate || !endDate || endDate < startDate) return [];
  const days: TripDay[] = [];
  for (let date = new Date(`${startDate}T00:00:00Z`); date <= new Date(`${endDate}T00:00:00Z`) && days.length < 90; date = new Date(date.getTime() + 86_400_000)) {
    days.push({ date: date.toISOString().slice(0, 10), expectedBudget: null, activities: [] });
  }
  return days;
}

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = location.state as { from?: string; section?: DashboardSection; welcomeArrival?: boolean } | null;
  const [welcomeArrival, setWelcomeArrival] = useState(Boolean(navigationState?.welcomeArrival));
  const [trips, setTrips] = useState(loadTrips);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<DashboardSection>(() => navigationState?.from && navigationState.section ? navigationState.section : "Khám phá");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDestinations, setDraftDestinations] = useState<TripDestination[]>([]);
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftEndDate, setDraftEndDate] = useState("");
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1, 12); });
  const [draftCover, setDraftCover] = useState<File | null>(null);
  const [draftCoverPreview, setDraftCoverPreview] = useState<string | null>(null);
  const [draftCoverPreviewFailed, setDraftCoverPreviewFailed] = useState(false);
  const [photoOverrides, setPhotoOverrides] = useState<Record<string, string>>({});
  const [importOpen, setImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importedTrip, setImportedTrip] = useState<Trip | null>(null);
  const [exportError, setExportError] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);
  const photoUrlsRef = useRef<Record<string, string>>({});
  const restoredCoversRef = useRef(false);
  const trip = trips[selectedIndex] ?? trips[0];
  const tripRoute = location.pathname.match(/^\/home\/trip\/([^/]+)(?:\/(prep|map|report))?$/);
  const showingTripDetail = Boolean(tripRoute);
  const tripSubpage = tripRoute?.[2];
  const detailId = tripRoute?.[1];
  let decodedDetailId: string | undefined;
  try { decodedDetailId = detailId ? decodeURIComponent(detailId) : undefined; } catch { decodedDetailId = undefined; }
  const routeTrip = decodedDetailId ? trips.find((item) => item.id === decodedDetailId) : null;
  const activeTrip = showingTripDetail ? routeTrip : trip;
  const displayTrip = useMemo(() => activeTrip ? { ...activeTrip, image: photoOverrides[activeTrip.id] ?? activeTrip.image } : null, [activeTrip, photoOverrides]);
  const draftRouteStops = useMemo(() => draftDestinations.filter((stop) => stop.name.trim()), [draftDestinations]);
  const shownCalendarDays = useMemo(() => calendarGrid(calendarMonth), [calendarMonth]);
  const openDatePicker = (target: DatePickerTarget) => {
    const value = target === "start" ? draftStartDate : draftEndDate;
    const anchor = target === "end" && !value && draftStartDate ? draftStartDate : value;
    const date = toLocalDate(anchor);
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12));
    setDatePickerTarget(target);
  };
  const chooseDraftDate = (value: string) => {
    if (datePickerTarget === "start") {
      setDraftStartDate(value);
      if (draftEndDate && draftEndDate < value) setDraftEndDate("");
    } else if (datePickerTarget === "end") setDraftEndDate(value);
    setDatePickerTarget(null);
  };
  const finishWelcomeArrival = () => {
    setWelcomeArrival(false);
    navigate(location.pathname, { replace: true, state: { section: activeSection } });
  };

  useEffect(() => {
    if (restoredCoversRef.current) return;
    restoredCoversRef.current = true;
    let canceled = false;
    void Promise.all(trips.filter((item) => item.coverAttachmentId).map(async (item) => {
      const blob = await readAttachment(item.coverAttachmentId!).catch(() => null);
      return blob ? [item.id, URL.createObjectURL(blob)] as const : null;
    })).then((entries) => {
      const restored = Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null));
      if (canceled) Object.values(restored).forEach(URL.revokeObjectURL);
      else { photoUrlsRef.current = { ...photoUrlsRef.current, ...restored }; setPhotoOverrides((current) => ({ ...restored, ...current })); }
    });
    return () => { canceled = true; };
  }, [trips]);
  useEffect(() => () => Object.values(photoUrlsRef.current).forEach(URL.revokeObjectURL), []);
  useEffect(() => () => { if (draftCoverPreview) URL.revokeObjectURL(draftCoverPreview); }, [draftCoverPreview]);
  useEffect(() => saveTrips(trips), [trips]);

  const closeDialog = () => setDialog(null);
  const chooseDestination = useCallback((destination: { name: string; id: string }) => {
    setDraftDestinations([{ name: destination.name, id: destination.id }]);
    setDraftName("");
    setDraftStartDate("");
    setDraftEndDate("");
    setDialog("new");
  }, []);
  const openCreateTrip = () => {
    setDraftName(""); setDraftDestinations([{ name: "" }]); setDraftStartDate(""); setDraftEndDate(""); setDraftCover(null); setDraftCoverPreview(null); setDraftCoverPreviewFailed(false); setDialog("new");
  };
  const addDraftDestination = () => setDraftDestinations((current) => [...current, { name: "" }]);
  const updateDraftDestination = (index: number, name: string) => setDraftDestinations((current) => current.map((stop, stopIndex) => stopIndex === index ? { ...stop, name, id: undefined } : stop));
  const removeDraftDestination = (index: number) => {
    setDraftDestinations((current) => current.filter((_, stopIndex) => stopIndex !== index));
  };
  const createTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draftName.trim();
    const routeStops = draftRouteStops;
    if (!name || (draftStartDate && !draftEndDate) || (!draftStartDate && draftEndDate) || (draftEndDate && draftEndDate < draftStartDate)) return;
    const startDate = draftStartDate;
    const endDate = draftEndDate;
    const dateRange = startDate && endDate && endDate >= startDate ? `${formatDateLabel(startDate)} – ${formatDateLabel(endDate)}` : "Chưa chọn ngày";
    const coverAttachmentId = draftCover ? await saveAttachment(draftCover) : undefined;
    const primaryDestination = routeStops[0];
    const days = buildTripDays(startDate, endDate).map((day, index, allDays) => {
      const defaultStopIndex = routeStops.length ? Math.min(routeStops.length - 1, Math.floor(index * routeStops.length / allDays.length)) : -1;
      return { ...day, destination: defaultStopIndex >= 0 ? routeStops[defaultStopIndex]?.name : undefined };
    });
    const created: Trip = { id: `draft-${crypto.randomUUID()}`, name, destination: primaryDestination?.name || name, destinationId: primaryDestination?.id, destinations: routeStops, image: "", dateRange, startDate: startDate || undefined, endDate: endDate || undefined, coverAttachmentId, itinerary: days, spent: 0, estimate: null, isDemo: false };
    if (draftCover) { const preview = URL.createObjectURL(draftCover); photoUrlsRef.current[created.id] = preview; setPhotoOverrides((current) => ({ ...current, [created.id]: preview })); }
    setTrips((current) => [created, ...current]);
    setSelectedIndex(0);
    setDraftName("");
    setDraftDestinations([]);
    setDraftStartDate("");
    setDraftEndDate("");
    setDraftCover(null);
    setDraftCoverPreview(null);
    setDialog(null);
    navigate(`/home/trip/${encodeURIComponent(created.id)}`, { state: { from: location.pathname, section: activeSection } });
  };
  const updateDate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!displayTrip) return;
    const validRange = draftStartDate && draftEndDate && draftEndDate >= draftStartDate;
    const nextDays = validRange ? buildTripDays(draftStartDate, draftEndDate) : [];
    setTrips((current) => current.map((item) => {
      if (item.id !== displayTrip.id) return item;
      const oldDays = item.itinerary ?? [];
      const inRangeDates = new Set(nextDays.map((day) => day.date));
      const itinerary = [...nextDays.map((day) => ({ ...day, ...(oldDays.find((old) => old.date === day.date) ?? {}) })), ...oldDays.filter((day) => !inRangeDates.has(day.date) && day.activities.length)].sort((a, b) => a.date.localeCompare(b.date));
      return {
        ...item,
        startDate: validRange ? draftStartDate : undefined,
        endDate: validRange ? draftEndDate : undefined,
        dateRange: validRange ? `${formatDateLabel(draftStartDate)} – ${formatDateLabel(draftEndDate)}` : "Chưa chọn ngày",
        itinerary,
      };
    }));
    setDialog(null);
  };
  const pickPhoto = async (file: File) => {
    if (!displayTrip) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) return;
    const attachmentId = await saveAttachment(file);
    const photoUrl = URL.createObjectURL(file);
    const oldUrl = photoUrlsRef.current[displayTrip.id];
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    photoUrlsRef.current[displayTrip.id] = photoUrl;
    setPhotoOverrides((current) => {
      return { ...current, [displayTrip.id]: photoUrl };
    });
    setTrips((current) => current.map((item) => item.id === displayTrip.id ? { ...item, coverAttachmentId: attachmentId } : item));
  };

  const readWorkbook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    setImportBusy(true);
    setImportError("");
    setImportPreview(null);
    try {
      setImportPreview(await parseTripWorkbook(file));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Không thể đọc tệp Excel này.");
    } finally {
      setImportBusy(false);
    }
  };
  const confirmWorkbookImport = () => {
    if (!importPreview) return;
    const imported = { ...importPreview.trip, image: "" };
    setSelectedIndex(0);
    setTrips((current) => [imported, ...current]);
    setImportOpen(false);
    setImportPreview(null);
    setImportedTrip(imported);
  };
  const openImport = () => {
    setImportOpen(true);
  };
  const exportTrip = async (targetTrip: Trip) => {
    try { await exportTripWorkbook(targetTrip); }
    catch (error) { setExportError(error instanceof Error ? error.message : "Không thể tạo tệp Excel. Vui lòng thử lại."); }
  };
  const deleteTrip = (targetTrip: Trip) => {
    const deletedIndex = trips.findIndex((item) => item.id === targetTrip.id);
    if (deletedIndex < 0) return;
    const nextTripCount = trips.length - 1;
    setTrips((current) => current.filter((item) => item.id !== targetTrip.id));
    setSelectedIndex((current) => current > deletedIndex ? current - 1 : current === deletedIndex ? Math.min(deletedIndex, Math.max(0, nextTripCount - 1)) : current);
  };

  const addActivity = (date: string, activity: TripActivity) => {
    if (!displayTrip) return;
    setTrips((current) => current.map((item) => {
      if (item.id !== displayTrip.id) return item;
      let itinerary = (item.itinerary ?? []).map((day) => ({ ...day, activities: day.activities.filter((existing) => existing.id !== activity.id) }));
      const dayIndex = itinerary.findIndex((day) => day.date === date);
      if (dayIndex < 0) itinerary.push({ date, expectedBudget: activity.plannedCost ?? activity.cost ?? 0, activities: [activity] });
      else itinerary[dayIndex] = { ...itinerary[dayIndex]!, activities: [activity, ...itinerary[dayIndex]!.activities] };
      itinerary = itinerary.map((day) => ({ ...day, expectedBudget: day.activities.reduce((sum, entry) => sum + (entry.plannedCost ?? entry.cost ?? 0), 0) }));
      const spent = itinerary.flatMap((day) => day.activities).reduce((sum, entry) => sum + (entry.actualCost ?? 0), 0);
      return { ...item, itinerary, spent };
    }));
  };

  const deleteActivity = (activityId: string) => {
    if (!displayTrip) return;
    setTrips((current) => current.map((item) => {
      if (item.id !== displayTrip.id) return item;
      const itinerary = (item.itinerary ?? []).map((day) => {
        const activities = day.activities.filter((activity) => activity.id !== activityId);
        return { ...day, activities, expectedBudget: activities.reduce((sum, activity) => sum + (activity.plannedCost ?? activity.cost ?? 0), 0) };
      });
      const spent = itinerary.flatMap((day) => day.activities).reduce((sum, activity) => sum + (activity.actualCost ?? 0), 0);
      return { ...item, itinerary, spent };
    }));
  };
  const updatePreparation = (tasks: TripPreparationTask[]) => {
    if (!displayTrip) return;
    setTrips((current) => current.map((item) => item.id === displayTrip.id ? { ...item, preparation: tasks } : item));
  };
  const renameActivityCategory = (typeId: string, previousName: string, name: string, group: string) => {
    setTrips((current) => current.map((item) => ({
      ...item,
      itinerary: (item.itinerary ?? []).map((day) => ({
        ...day,
        activities: day.activities.map((activity) => activity.customTypeId === typeId || activity.category === previousName ? { ...activity, category: name, categoryGroup: group || undefined, customTypeId: name ? typeId : undefined } : activity),
      })),
    })));
  };

  const exportErrorSheet = exportError && <GlassSheet title="Không thể xuất Excel" subtitle={exportError} icon={<X aria-hidden="true" />} onClose={() => setExportError("")}><div className={styles.importSuccess}><button type="button" onClick={() => setExportError("")}>Đóng</button></div></GlassSheet>;

  if (showingTripDetail) {
    if (!routeTrip) return <main className={styles.notFound}><p>Không tìm thấy chuyến đi này.</p><button type="button" onClick={() => navigate("/home")}>Về trang chủ</button></main>;
    if (!displayTrip) return null;
    if (tripSubpage === "prep" || tripSubpage === "map") return <TripPreparationPage trip={displayTrip} onBack={() => navigate(`/home/trip/${encodeURIComponent(displayTrip.id)}`)} onHome={() => navigate(navigationState?.from ?? "/home", { state: { section: navigationState?.section ?? "Chuyến đi" } })} onReport={() => navigate(`/home/trip/${encodeURIComponent(displayTrip.id)}/report`)} onSave={updatePreparation} />;
    if (tripSubpage === "report") return <TripReportPage trip={displayTrip} onBack={() => navigate(`/home/trip/${encodeURIComponent(displayTrip.id)}`)} />;
    return <><TripDetailExperience key={displayTrip.id} trip={displayTrip} onBack={() => navigate(navigationState?.from ?? "/home", { state: { section: navigationState?.section ?? "Khám phá" } })} onPhotoSelected={pickPhoto} onSaveActivity={addActivity} onDeleteActivity={deleteActivity} onRenameActivityCategory={renameActivityCategory} onExportTrip={() => exportTrip(displayTrip)} onDeleteTrip={() => { deleteTrip(displayTrip); navigate(navigationState?.from ?? "/home", { state: { section: navigationState?.section ?? "Chuyến đi" } }); }} onOpenPreparation={() => navigate(`/home/trip/${encodeURIComponent(displayTrip.id)}/prep`)} onOpenReport={() => navigate(`/home/trip/${encodeURIComponent(displayTrip.id)}/report`)} />{exportErrorSheet}</>;
  }
  return <>
      <input ref={importInputRef} className={styles.hiddenInput} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-label="Chọn sổ lịch trình Excel" onChange={readWorkbook} />
      <DashboardExperience trips={trips.map((item) => ({ ...item, image: photoOverrides[item.id] ?? item.image }))} onSelectTrip={setSelectedIndex} onOpenTrip={(item) => navigate(`/home/trip/${encodeURIComponent(item.id)}`, { state: { from: location.pathname, section: activeSection } })} onCreateTrip={openCreateTrip} onDeleteTrip={deleteTrip} onChooseDestination={chooseDestination} onImport={openImport} onExport={exportTrip} active={activeSection} onChange={setActiveSection} query={searchQuery} onQueryChange={setSearchQuery} dockVisible={!dialog && !importOpen && !importedTrip && !welcomeArrival} />
      {dialog === "new" && <GlassSheet title="Tạo chuyến đi mới" variant="sheet" className={styles.createTripSheet} onClose={closeDialog}><form className={styles.createForm} onSubmit={createTrip}>
        <label className={styles.coverPicker}><ImagePlus aria-hidden="true" /><span>{draftCover ? draftCover.name : "Thêm ảnh bìa"}</span><b>{draftCover ? "Đã chọn" : "Chọn ảnh"}</b><input type="file" accept="image/*" aria-label="Chọn ảnh bìa" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (!file) return; if (draftCoverPreview) URL.revokeObjectURL(draftCoverPreview); setDraftCover(file); setDraftCoverPreview(URL.createObjectURL(file)); setDraftCoverPreviewFailed(false); event.currentTarget.value = ""; }} /></label>
        {draftCover && (draftCoverPreview && !draftCoverPreviewFailed ? <img className={styles.createPreview} src={draftCoverPreview} alt="Ảnh bìa chuyến đi" onError={() => setDraftCoverPreviewFailed(true)} /> : <div className={styles.createPreviewFallback}><ImagePlus aria-hidden="true" /><span>Không thể xem trước định dạng ảnh này</span></div>)}
        <label className={styles.formField}>Tên chuyến đi<input autoFocus value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder={draftRouteStops.length > 1 ? `Hành trình ${draftRouteStops.map((stop) => stop.name).join(" – ").toLocaleLowerCase("vi")}` : "Ví dụ: Khám phá Đà Lạt"} required maxLength={50} /></label>
        <section className={styles.formStops} aria-label="Điểm đến"><header><h3>Điểm đến</h3><button type="button" onClick={addDraftDestination}><Plus aria-hidden="true" />Thêm điểm dừng</button></header><div>{draftDestinations.map((stop, index) => <div className={styles.stopField} key={`${stop.id ?? "stop"}-${index}`}><i aria-hidden="true" /><input value={stop.name} onChange={(event) => updateDraftDestination(index, event.target.value)} placeholder={index === 0 ? "Điểm đến đầu tiên" : "Điểm đến tiếp theo"} maxLength={70} aria-label={`Điểm đến ${index + 1}`} /><button type="button" aria-label={`Xóa điểm đến ${index + 1}`} onClick={() => removeDraftDestination(index)}><X /></button></div>)}</div></section>
        <fieldset className={styles.dateFields}><legend>Thời gian</legend><div><div className={styles.dateField}><span>Ngày đi</span><button type="button" aria-label="Chọn ngày đi" onClick={() => openDatePicker("start")}><strong>{displayDateValue(draftStartDate)}</strong><CalendarDays aria-hidden="true" /></button></div><div className={styles.dateField}><span>Ngày về</span><button type="button" aria-label="Chọn ngày về" onClick={() => openDatePicker("end")}><strong>{displayDateValue(draftEndDate)}</strong><CalendarDays aria-hidden="true" /></button></div></div></fieldset>
        <button className={styles.createTripSubmit} type="submit" disabled={!draftName.trim() || Boolean((draftStartDate && !draftEndDate) || (!draftStartDate && draftEndDate) || (draftStartDate && draftEndDate < draftStartDate))}>Tạo chuyến đi</button>
      </form></GlassSheet>}
      {dialog === "new" && datePickerTarget && <GlassSheet title={datePickerTarget === "start" ? "Chọn ngày đi" : "Chọn ngày về"} subtitle="Chọn ngày cho chuyến đi của bạn." icon={<CalendarDays aria-hidden="true" />} variant="sheet" className={styles.datePickerSheet} onClose={() => setDatePickerTarget(null)}><div className={styles.datePickerContent}><header><button type="button" aria-label="Tháng trước" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}><ChevronLeft /></button><strong>{new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(calendarMonth)}</strong><button type="button" aria-label="Tháng sau" onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}><ChevronRight /></button></header><div className={styles.calendarGrid}>{["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => <span key={day}>{day}</span>)}{shownCalendarDays.map((day) => { const value = toDateValue(day); const selectedValue = datePickerTarget === "start" ? draftStartDate : draftEndDate; const disabled = datePickerTarget === "end" && Boolean(draftStartDate) && value < draftStartDate; return <button key={value} type="button" aria-pressed={value === selectedValue} disabled={disabled} className={day.getMonth() === calendarMonth.getMonth() ? "" : styles.otherMonthDay} onClick={() => chooseDraftDate(value)}>{day.getDate()}</button>; })}</div><button type="button" className={styles.datePickerCancel} onClick={() => setDatePickerTarget(null)}>Hủy</button></div></GlassSheet>}
      {dialog === "date" && <GlassSheet title="Ngày chuyến đi" onClose={closeDialog}><form className={styles.form} onSubmit={updateDate}>
        <label>Ngày bắt đầu<input autoFocus type="date" value={draftStartDate} onChange={(event) => setDraftStartDate(event.target.value)} /></label>
        <label>Ngày kết thúc<input type="date" min={draftStartDate || undefined} value={draftEndDate} onChange={(event) => setDraftEndDate(event.target.value)} /></label>
        <p className={styles.disclosure}>Ngày được lưu cục bộ cho chuyến này.</p><button className={styles.primary} type="submit">Lưu ngày</button>
      </form></GlassSheet>}
      {importOpen && <ImportExcelDialog preview={importPreview} error={importError} busy={importBusy} onChoose={() => importInputRef.current?.click()} onCancel={() => { setImportOpen(false); setImportPreview(null); setImportError(""); }} onConfirm={confirmWorkbookImport} />}
      {exportErrorSheet}
      {importedTrip && <GlassSheet title="Đọc dữ liệu thành công" subtitle="Chuyến đi đã được lưu trên thiết bị này." icon={<Check aria-hidden="true" />} onClose={() => setImportedTrip(null)}><div className={styles.importSuccess}><strong>{importedTrip.name}</strong><span>{importedTrip.itinerary?.flatMap((day) => day.activities).length ?? 0} hoạt động đã nhập</span><button type="button" onClick={() => { setImportedTrip(null); navigate(`/home/trip/${encodeURIComponent(importedTrip.id)}`); }}>Mở lịch trình</button></div></GlassSheet>}
      {welcomeArrival && <div className={styles.welcomeArrival} onAnimationEnd={finishWelcomeArrival} aria-hidden="true" />}
    </>;
}
