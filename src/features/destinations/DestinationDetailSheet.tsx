import { Heart, Plus, Star } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { getDestinationDisplayType, type Destination } from "./catalog";
import type { FeaturedPlaceRating } from "./featuredRatings";
import { fetchOnlineDestinationInfo, type OnlineDestinationInfo } from "./onlineDestinationInfo";
import { destinationEditorialDetails, destinationEntryPrices, estimateDestinationBudget } from "./editorialDetails";
import { GlassSheet } from "../../ui/sheets/GlassSheet";
import styles from "./DestinationDetailSheet.module.css";

type Props = {
  destination: Destination;
  rating?: FeaturedPlaceRating;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
  onPlan: () => void;
};

export default function DestinationDetailSheet({ destination, rating, isFavorite, onToggleFavorite, onClose, onPlan }: Props) {
  const details = destinationEditorialDetails[destination.id];
  const [onlineInfoResult, setOnlineInfoResult] = useState<{ destinationId: string; info: OnlineDestinationInfo | null } | null>(null);

  useEffect(() => {
    let active = true;
    void fetchOnlineDestinationInfo(destination.id, destination.name).then((info) => {
      if (!active) return;
      setOnlineInfoResult({ destinationId: destination.id, info });
    });
    return () => { active = false; };
  }, [destination.id, destination.name]);

  const onlineInfo = onlineInfoResult?.destinationId === destination.id ? onlineInfoResult.info : null;
  const onlineInfoStatus = onlineInfoResult?.destinationId === destination.id ? (onlineInfoResult.info ? "ready" : "missing") : "loading";
  const isGenericDescription = destination.description.includes("Cơ sở dữ liệu ngành Du lịch Việt Nam");
  const description = onlineInfo?.summary ?? details?.description ?? (isGenericDescription ? "" : destination.description);
  const conciseDescription = description.length > 155 ? `${description.slice(0, 152).trimEnd()}…` : description;
  const entryPrice = destinationEntryPrices[destination.id];
  const exactOsmCharge = rating?.charge && !["yes", "true", "1"].includes(rating.charge.toLowerCase())
    ? rating.charge
    : "";
  const entryCost = entryPrice?.amount ?? (exactOsmCharge ? exactOsmCharge : rating?.fee === "no" ? "0 đ vé vào cửa" : "");
  const budgetAmount = details?.cost ?? (entryCost ? `${entryCost} · giá vé tại điểm` : estimateDestinationBudget(destination.types));
  const budget = budgetAmount;
  const displayType = getDestinationDisplayType(destination);
  const season = details?.season ?? (displayType === "Biển" || displayType === "Đảo"
    ? "Mùa khô, biển êm tại địa phương"
    : displayType === "Thác nước" || displayType === "Suối"
      ? "Sau mùa mưa, khi dòng nước ổn định"
      : "Mùa khô, thời tiết thuận lợi để tham quan");
  const experiences = details?.experiences ?? (displayType === "Biển" || displayType === "Đảo"
    ? [`Ngắm cảnh và thư giãn tại ${destination.name}`, `Thử hải sản ở ${destination.province}`, "Kết hợp các điểm ven biển gần đó"]
    : displayType === "Thác nước" || displayType === "Suối"
      ? [`Khám phá cảnh quan tại ${destination.name}`, "Đi bộ theo lối tham quan được phép", `Thưởng thức món địa phương ở ${destination.province}`]
      : displayType === "Núi" || displayType === "Vườn quốc gia" || displayType === "Khu bảo tồn"
        ? [`Ngắm cảnh từ các điểm nhìn tại ${destination.name}`, "Đi bộ theo tuyến tham quan phù hợp", `Khám phá đặc sản vùng ${destination.province}`]
        : [`Tham quan kiến trúc và câu chuyện tại ${destination.name}`, `Khám phá văn hóa địa phương ở ${destination.province}`, "Dạo các điểm tham quan lân cận"]);
  return createPortal(<GlassSheet title={destination.name} variant="sheet" dense hideHeader showClose={false} className={styles.destinationSheet} onClose={onClose}>
    <div className={styles.detailContent}>
      <div className={styles.hero}>
        {destination.cover && <img className={styles.cover} src={destination.cover} alt={`Phong cảnh ${destination.name}`} />}
      </div>
      <div className={styles.detailBody}>
        <div className={styles.meta}><span>{displayType} · {destination.macroRegion}</span><span className={styles.rating} aria-label="Đánh giá 4.5 trên 5"><strong>4.5/5 <Star fill="currentColor" /></strong></span></div>
        <h2>{destination.name}</h2>
        {conciseDescription ? <p className={styles.description}>{conciseDescription}</p> : <p className={styles.description} role="status">{onlineInfoStatus === "loading" ? "Đang tải giới thiệu địa điểm…" : "Đang cập nhật mô tả ngắn cho địa điểm này."}</p>}
        <div className={styles.infoGrid}>
          <section><span>THỜI ĐIỂM LÝ TƯỞNG</span><p>{season}</p></section>
          <section><span>NGÂN SÁCH THAM KHẢO</span><p>{budget}</p>{entryPrice && <small className={styles.priceNote}>{entryPrice.audience}</small>}</section>
        </div>
        <section className={styles.experiences}><h3>TRẢI NGHIỆM KHÔNG THỂ BỎ LỠ</h3><ul>{experiences.map((experience) => <li key={experience}>{experience}</li>)}</ul></section>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.favorite} aria-pressed={isFavorite} onClick={onToggleFavorite}><Heart fill={isFavorite ? "currentColor" : "none"} />{isFavorite ? "Yêu thích" : "Yêu thích"}</button>
        <button type="button" className={styles.plan} onClick={onPlan}><Plus />Thêm lên kế hoạch</button>
      </div>
    </div>
  </GlassSheet>, document.body);
}
