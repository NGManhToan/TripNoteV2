import { useState } from "react";
import { formatDong, type Trip } from "../trips/data";
import styles from "./TripReport.module.css";

type Props = { trip: Trip };

export default function TripReport({ trip }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const activities = (trip.itinerary ?? []).flatMap((day) => day.activities.map((activity) => ({ ...activity, date: day.date })));
  const actual = activities.reduce((sum, activity) => sum + (activity.actualCost ?? 0), 0);
  const planned = activities.reduce((sum, activity) => sum + (activity.plannedCost ?? activity.cost ?? 0), 0);
  const distributionMode = actual > 0 ? "actual" : "planned";
  const categories = activities.reduce<Record<string, number>>((totals, activity) => {
    const amount = distributionMode === "actual" ? activity.actualCost ?? 0 : activity.plannedCost ?? activity.cost ?? 0;
    if (amount > 0) totals[activity.category || "Khác"] = (totals[activity.category || "Khác"] ?? 0) + amount;
    return totals;
  }, {});
  const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const distributionTotal = entries.reduce((total, [, amount]) => total + amount, 0);
  const slices = entries.map(([name, amount], index) => {
    const percent = distributionTotal ? amount / distributionTotal * 100 : 0;
    const offset = entries.slice(0, index).reduce((sum, [, previous]) => sum + (distributionTotal ? previous / distributionTotal * 100 : 0), 0);
    return { name, amount, percent, offset, className: styles[`slice${index % 6}`] };
  });
  const days = trip.itinerary?.length ?? 0;
  const remaining = trip.estimate === null ? null : trip.estimate - actual;
  const selectedActivities = selectedCategory ? activities.filter((activity) => activity.category === selectedCategory && (distributionMode === "actual" ? (activity.actualCost ?? 0) > 0 : (activity.plannedCost ?? activity.cost ?? 0) > 0)) : [];
  const compactActual = actual >= 1_000_000 ? `${(actual / 1_000_000).toFixed(1).replace(".", ",")}tr` : actual >= 1_000 ? `${Math.round(actual / 1_000)}k` : `${actual}đ`;

  return <div className={styles.report}>
    <section className={styles.metrics} aria-label="Tổng quan chuyến đi">
      <div><span>Tổng dự kiến</span><strong>{formatDong(trip.estimate ?? planned)}</strong></div>
      <div><span>Đã chi</span><strong>{formatDong(actual)}</strong></div>
      <div><span>Còn lại</span><strong>{remaining === null ? "Chưa nhập ngân sách" : formatDong(remaining)}</strong></div>
      <div><span>Thời lượng</span><strong>{days} ngày · {activities.length} hoạt động</strong></div>
    </section>
    <section className={styles.breakdown} aria-label="Biểu đồ chi phí theo danh mục">
      <div className={styles.breakdownTitle}><div><span>PHÂN BỔ NGÂN SÁCH</span><h3>{distributionMode === "actual" ? "Chi phí thực tế" : "Chi phí dự kiến"}</h3></div><strong>{formatDong(distributionTotal)}</strong></div>
      {slices.length ? <div className={styles.chartLayout}>
        <svg className={styles.chart} viewBox="0 0 42 42" role="img" aria-label={`${distributionMode === "actual" ? "Tổng chi thực tế" : "Tổng chi dự kiến"} ${formatDong(distributionTotal)}`}>
          <circle className={styles.track} cx="21" cy="21" r="15.9155" />
          {slices.map((slice) => <circle key={slice.name} className={`${slice.className} ${selectedCategory === slice.name ? styles.highlight : ""}`} cx="21" cy="21" r="15.9155" strokeDasharray={`${slice.percent} ${100 - slice.percent}`} strokeDashoffset={-slice.offset} />)}
          <text className={styles.chartCenter} x="21" y="20">{selectedCategory ? `${Math.round(slices.find((slice) => slice.name === selectedCategory)?.percent ?? 0)}%` : distributionMode === "actual" ? compactActual : distributionTotal >= 1_000_000 ? `${(distributionTotal / 1_000_000).toFixed(1).replace(".", ",")}tr` : distributionTotal >= 1_000 ? `${Math.round(distributionTotal / 1_000)}k` : `${distributionTotal}đ`}</text><text className={styles.chartCaption} x="21" y="24.8">{selectedCategory ?? (distributionMode === "actual" ? "Đã chi" : "Dự kiến")}</text>
        </svg>
        <ul className={styles.legend}>{slices.map((slice) => <li key={slice.name}><button type="button" aria-pressed={selectedCategory === slice.name} onClick={() => setSelectedCategory((current) => current === slice.name ? null : slice.name)}><span className={slice.className} /><span className={styles.categoryName}>{slice.name}</span><strong>{formatDong(slice.amount)}<small>{Math.round(slice.percent)}%</small></strong></button></li>)}</ul>
      </div> : <p className={styles.empty}>Chưa có chi phí để phân bổ theo danh mục.</p>}
      {selectedCategory && selectedActivities.length > 0 && <div className={styles.related}><h4>Hoạt động · {selectedCategory}</h4>{selectedActivities.map((activity) => <div key={activity.id}><span>{activity.name}<small>{activity.date}</small></span><strong>{formatDong(distributionMode === "actual" ? activity.actualCost ?? 0 : activity.plannedCost ?? activity.cost ?? 0)}</strong></div>)}</div>}
      <div className={styles.totals}><p><span>Tổng dự kiến ở hoạt động</span><strong>{formatDong(planned)}</strong></p>{trip.estimate !== null && <p><span>Chênh lệch ngân sách</span><strong>{formatDong(remaining ?? 0)}</strong></p>}</div>
    </section>
  </div>;
}
