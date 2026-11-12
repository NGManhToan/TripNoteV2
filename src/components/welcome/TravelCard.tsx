import { motion, useReducedMotion } from "framer-motion";
import { cardEnter } from "../../animations/transitions";
import { useFloating } from "../../hooks/useFloating";
import styles from "./TravelCard.module.css";

type Position = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
type Props = { src: string; title: string; position: Position; index: number; transitioning: boolean };

export default function TravelCard({ src, title, position, index, transitioning }: Props) {
  const reducedMotion = useReducedMotion();
  const floating = useFloating(index);

  const exits = [
    { x: "-38vw", y: "-30vh", rotate: -18 },
    { x: "40vw", y: "-34vh", rotate: 16 },
    { x: "-38vw", y: "33vh", rotate: 14 },
    { x: "40vw", y: "35vh", rotate: -18 },
  ];

  return <motion.figure className={`${styles.card} ${styles[position]}`} variants={cardEnter} initial="hidden" animate={transitioning ? { ...exits[index], opacity: 0, scale: 0.72, filter: "blur(5px)" } : "visible"} transition={transitioning ? { duration: 0.84, delay: index * 0.035, ease: [0.18, 0.72, 0.22, 1] } : { delay: 2.2 + index * 0.16 }}>
    <motion.div className={styles.float} animate={transitioning || reducedMotion ? undefined : floating} transition={{ duration: 7.2 + index * 1.85, delay: index * 0.8, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }}>
      <img src={src} alt={title} loading="eager" />
      <span className={styles.glint} aria-hidden="true" />
    </motion.div>
  </motion.figure>;
}
