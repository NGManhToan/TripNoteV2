import islands from "../../assets/images/welcome/photo-islands.png";
import mountains from "../../assets/images/welcome/photo-mountains.png";
import city from "../../assets/images/welcome/photo-city.png";
import temple from "../../assets/images/welcome/photo-temple.png";
import TravelCard from "./TravelCard";
import styles from "./FloatingCards.module.css";

type Props = { transitioning: boolean; visibleCards?: number };

const cards = [
  { src: mountains, title: "Sa Pa", position: "topLeft" as const },
  { src: islands, title: "Vịnh Hạ Long", position: "topRight" as const },
  { src: city, title: "Đà Lạt", position: "bottomLeft" as const },
  { src: temple, title: "Angkor Wat", position: "bottomRight" as const },
];

export default function FloatingCards({ transitioning, visibleCards = cards.length }: Props) {
  return <div className={styles.cards} aria-label="Điểm đến nổi bật">
    {cards.slice(0, visibleCards).map((card, index) => <TravelCard key={card.title} {...card} index={index} transitioning={transitioning} />)}
  </div>;
}
