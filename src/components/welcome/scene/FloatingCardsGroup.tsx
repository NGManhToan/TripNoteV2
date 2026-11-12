import FloatingCard3D, { type CardConfig } from "./FloatingCard3D";
import islands from "../../../assets/images/welcome/photo-islands.png";
import mountains from "../../../assets/images/welcome/photo-mountains.png";
import city from "../../../assets/images/welcome/photo-city.png";
import temple from "../../../assets/images/welcome/photo-temple.png";

type Props = { transitioning: boolean; reducedMotion: boolean; visibleCards: number };

const cards: CardConfig[] = [
  { src: mountains, position: [-1.24, 2.55, 0.12], rotation: [0.08, 0.16, -0.11], seed: 0, exit: [-2.3, 1.5, 0.6] },
  { src: islands, position: [1.24, 2.42, -0.18], rotation: [-0.06, -0.13, 0.1], seed: 1, exit: [2.4, 1.65, 0.4] },
  { src: city, position: [-1.27, -0.78, 0.22], rotation: [0.07, -0.14, -0.085], seed: 2, exit: [-2.3, -1.7, 0.3] },
  { src: temple, position: [1.27, -0.74, -0.12], rotation: [-0.08, 0.12, 0.095], seed: 3, exit: [2.5, -1.7, 0.5] },
];

export default function FloatingCardsGroup({ transitioning, reducedMotion, visibleCards }: Props) {
  return <group>
    {cards.slice(0, visibleCards).map((card) => <FloatingCard3D key={card.src} card={card} transitioning={transitioning} reducedMotion={reducedMotion} />)}
  </group>;
}
