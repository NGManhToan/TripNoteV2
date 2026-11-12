import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ExternalLink, MapPin, Route } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Trip } from "../trips/data";
import { formatDong, tripRouteLabel } from "../trips/data";
import styles from "./TripMapPage.module.css";

type Props = { trip: Trip; onBack: () => void };

export default function TripMapPage({ trip, onBack }: Props) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const stops = (trip.itinerary ?? []).flatMap((day, dayIndex) => day.activities
    .filter((activity) => isGoogleMapsUrl(activity.mapUrl))
    .map((activity) => ({ ...activity, dayIndex, stop: activity.address || activity.location || activity.name })));
  const uniqueStops = stops.filter((stop, index) => stops.findIndex((item) => item.mapUrl === stop.mapUrl) === index);
  const directionsUrl = uniqueStops.length > 1
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(uniqueStops[0]!.stop)}&destination=${encodeURIComponent(uniqueStops.at(-1)!.stop)}&waypoints=${encodeURIComponent(uniqueStops.slice(1, -1).map((stop) => stop.stop).join("|"))}`
    : uniqueStops[0]?.mapUrl;

  return <motion.main className={styles.page} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : .32 }}>
    <header className={styles.header}><button type="button" onClick={onBack} aria-label="Quay lại chuyến đi"><ArrowLeft /></button><div><span>BẢN ĐỒ HÀNH TRÌNH</span><h1>{tripRouteLabel(trip)}</h1></div><Route aria-hidden="true" /></header>
    <section className={styles.mapPanel} aria-label="Các điểm dừng theo lịch trình">
      <div className={styles.mapGlow} aria-hidden="true" />
      <div className={styles.mapRoute} aria-hidden="true" />
      {uniqueStops.length ? uniqueStops.map((stop, index) => <article className={styles.stop} key={`${stop.id}-${stop.stop}`}>
        <span className={styles.marker}>{index + 1}</span><div><small>NGÀY {stop.dayIndex + 1} · {stop.time || "Chưa chọn giờ"}</small><strong>{stop.name}</strong><p><MapPin aria-hidden="true" />{stop.address || stop.location || "Chưa có địa chỉ cụ thể"}</p><a className={styles.placeLink} href={stop.mapUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />Mở vị trí đã lưu</a></div><b>{stop.plannedCost ?? stop.cost ? formatDong(stop.plannedCost ?? stop.cost ?? 0) : "—"}</b>
      </article>) : <div className={styles.empty}><MapPin /><strong>Chưa có điểm ghim trên bản đồ</strong><p>Chỉ hoạt động có liên kết Google Maps đã lưu mới xuất hiện ở đây.</p><button type="button" onClick={onBack}>Về lịch trình để thêm liên kết</button></div>}
    </section>
    <p className={styles.note}>{uniqueStops.length ? "Bản đồ chỉ hiển thị hoạt động có liên kết Google Maps đã lưu. Tuyến đường nhiều điểm được sắp theo thứ tự lịch trình." : "Chưa có hoạt động nào gắn liên kết Google Maps. Thêm link trong phần chỉnh sửa hoạt động để hiển thị tại đây."}</p>
    <div className={styles.actions}>{directionsUrl && <a href={directionsUrl} target="_blank" rel="noreferrer">{uniqueStops.length > 1 ? "Mở tuyến đường" : "Mở Google Maps"} <ExternalLink /></a>}<button type="button" onClick={() => navigate(`/home/trip/${encodeURIComponent(trip.id)}/report`)}>Xem báo cáo chi phí</button></div>
  </motion.main>;
}

function isGoogleMapsUrl(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLocaleLowerCase("en-US");
    return host === "maps.app.goo.gl" || (host === "goo.gl" && url.pathname.startsWith("/maps")) ||
      ((host === "google.com" || host.endsWith(".google.com")) && url.pathname.startsWith("/maps"));
  } catch {
    return false;
  }
}
