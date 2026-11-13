import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BriefcaseBusiness, ChartPie, Check, ClipboardCheck, Download, Home, Share2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useMemo, useState } from "react";
import { formatDong, type Trip } from "../trips/data";
import { exportTripWorkbook } from "../excel/workbook";
import { GlassSheet } from "../../ui/sheets/GlassSheet";
import TripReport from "./TripReport";
import styles from "./TripReportPage.module.css";

type Props = { trip: Trip; onBack: () => void; onHome: () => void; onPreparation: () => void };

export default function TripReportPage({ trip, onBack, onHome, onPreparation }: Props) {
  const reduceMotion = useReducedMotion();
  const [exporting, setExporting] = useState(false);
  const [exportedFile, setExportedFile] = useState<File | null>(null);
  const [exportError, setExportError] = useState("");
  const dailyCosts = useMemo(() => (trip.itinerary ?? []).map((day, index) => ({ label: `Ngày ${index + 1}`, value: day.activities.reduce((total, activity) => total + (activity.actualCost ?? 0), 0) })), [trip]);
  const maxDayCost = Math.max(1, ...dailyCosts.map((day) => day.value));
  const actual = (trip.itinerary ?? []).flatMap((day) => day.activities).reduce((sum, activity) => sum + (activity.actualCost ?? 0), 0);
  const progress = trip.estimate ? Math.min(100, Math.round(actual / trip.estimate * 100)) : null;

  const exportWorkbook = async () => {
    setExporting(true); setExportError("");
    try { setExportedFile(await exportTripWorkbook(trip)); } catch { setExportError("Không thể tạo tệp Excel. Vui lòng thử lại."); }
    finally { setExporting(false); }
  };
  const shareFile = async () => {
    if (!exportedFile || !navigator.share || !navigator.canShare?.({ files: [exportedFile] })) return;
    await navigator.share({ files: [exportedFile], title: `TripNote · ${trip.name}` });
  };

  return <><motion.main className={styles.page} initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .32 }}>
    <header className={styles.header}><button type="button" onClick={onBack} aria-label="Quay lại chuyến đi"><ArrowLeft /></button><div><span>BÁO CÁO CHUYẾN ĐI</span><h1>{trip.name}</h1></div></header>
    <section className={styles.usage}><div><span>Ngân sách đã sử dụng</span><strong>{progress === null ? "Chưa có ngân sách" : `${progress}%`}</strong></div><div className={styles.track}><i style={{ width: `${progress ?? 0}%` }} /></div><div className={styles.usageNumbers}><span>Đã chi <b>{formatDong(actual)}</b></span><span>Ngân sách <b>{trip.estimate === null ? "Chưa nhập" : formatDong(trip.estimate)}</b></span></div></section>
    <div className={styles.report}><TripReport trip={trip} /></div>
    <section className={styles.daily} aria-label="Chi phí thực tế theo ngày"><h2>Chi phí theo ngày</h2><p>Đã chi thực tế · {dailyCosts.length} ngày</p>
      {dailyCosts.length ? <div className={styles.bars}>{dailyCosts.map((day) => <div className={styles.barColumn} key={day.label}><strong>{day.value ? formatDong(day.value) : "—"}</strong><div className={styles.barTrack}><motion.i initial={false} animate={{ height: `${Math.max(day.value ? 8 : 2, day.value / maxDayCost * 100)}%` }} transition={{ duration: reduceMotion ? 0 : .5 }} /></div><span>{day.label}</span></div>)}</div> : <p className={styles.empty}>Chưa có ngày hoặc hoạt động trong lịch trình.</p>}
    </section>
    <button className={styles.export} type="button" onClick={() => void exportWorkbook()} disabled={exporting}><Download />{exporting ? "Đang tạo tệp…" : "Xuất file .xlsx"}</button>
    {exportError && <p role="alert" className={styles.error}>{exportError}</p>}
    {exportedFile && <GlassSheet title="Đã xuất file thành công" subtitle={exportedFile.name} icon={<Check aria-hidden="true" />} onClose={() => setExportedFile(null)}><div className={styles.success}><p>Tệp Excel đã được tải xuống và sẵn sàng chia sẻ.</p><button type="button" onClick={() => void shareFile()} disabled={!navigator.share || !navigator.canShare?.({ files: [exportedFile] })}><Share2 />Chia sẻ tệp</button><button type="button" onClick={() => setExportedFile(null)}>Hoàn tất</button></div></GlassSheet>}
  </motion.main>{createPortal(<nav className={styles.bottomNav} aria-label="Điều hướng chuyến đi"><button type="button" onClick={onHome}><Home aria-hidden="true" /><span>Trang chủ</span></button><button type="button" onClick={onBack}><BriefcaseBusiness aria-hidden="true" /><span>Lịch trình</span></button><button type="button" onClick={onPreparation}><ClipboardCheck aria-hidden="true" /><span>Chuẩn bị</span></button><button type="button" className={styles.activeNav} aria-current="page"><ChartPie aria-hidden="true" /><span>Báo cáo</span></button></nav>, document.body)}</>;
}
