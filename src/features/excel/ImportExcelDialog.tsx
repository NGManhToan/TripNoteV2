import { AlertTriangle, FileSpreadsheet, Upload } from "lucide-react";
import { GlassSheet } from "../../ui/sheets/GlassSheet";
import { formatDong } from "../trips/data";
import type { ImportPreview } from "./workbook";
import styles from "./ImportExcelDialog.module.css";

type Props = { preview: ImportPreview | null; error: string; busy: boolean; onChoose: () => void; onCancel: () => void; onConfirm: () => void };

export default function ImportExcelDialog({ preview, error, busy, onChoose, onCancel, onConfirm }: Props) {
  return <GlassSheet title="Nhập lịch trình Excel" subtitle="Xem dữ liệu trước khi thêm vào chuyến đi." icon={<FileSpreadsheet aria-hidden="true" />} variant="sheet" dense onClose={onCancel}>
    <div className={styles.content}>
      <button className={styles.fileButton} type="button" onClick={onChoose} disabled={busy}><Upload aria-hidden="true" />{busy ? "Đang đọc tệp…" : preview ? "Chọn tệp khác" : "Chọn tệp .xlsx"}</button>
      {error && <p className={styles.error} role="alert"><AlertTriangle aria-hidden="true" />{error}</p>}
      {preview && <>
        {preview.missingSheets.length > 0 && <p className={styles.warning} role="status"><AlertTriangle aria-hidden="true" />Thiếu sheet: {preview.missingSheets.join(", ")}. Chuyến đi vẫn có thể nhập từ sheet Tổng hợp.</p>}
        <section className={styles.preview} aria-label="Xem trước dữ liệu">
          <h2>{preview.trip.destination}</h2><p>{preview.trip.dateRange}</p>
          <div className={styles.stats}><div><strong>{preview.activityCount}</strong><span>hoạt động</span></div><div><strong>{preview.trip.places?.length ?? 0}</strong><span>địa điểm</span></div><div><strong>{preview.trip.shoppingItems?.length ?? 0}</strong><span>món cần mua</span></div></div>
          <div className={styles.cost}><span>Tổng dự kiến</span><strong>{formatDong(preview.trip.estimate ?? 0)}</strong><small>Chi phí thực tế: {formatDong(preview.trip.spent)} đã nhập</small></div>
        </section>
      </>}
      <div className={styles.actions}><button type="button" onClick={onCancel}>Hủy</button><button type="button" disabled={!preview || busy} onClick={onConfirm}>Nhập dữ liệu</button></div>
    </div>
  </GlassSheet>;
}
