import { motion, useReducedMotion } from "framer-motion";
import earth from "../../assets/images/welcome/earth.png";
import { globeEnter } from "../../animations/transitions";
import styles from "./GlobeScene.module.css";

type Props = { transitioning: boolean };

export default function GlobeScene({ transitioning }: Props) {
  const reducedMotion = useReducedMotion();

  return <div className={styles.scene} aria-hidden="true">
    <motion.div className={styles.globe} variants={globeEnter} initial="hidden" animate={transitioning ? { scale: 2.15, y: "-10%", rotate: 4, opacity: 0.12 } : "visible"} transition={transitioning ? { duration: reducedMotion ? 0.15 : 1.05, ease: [0.18, 0.72, 0.22, 1] } : undefined}>
      <motion.span className={styles.atmosphere} animate={transitioning ? { opacity: 0.08, scale: 1.28 } : reducedMotion ? undefined : { opacity: [0.48, 0.82, 0.55, 0.74, 0.48], scale: [0.97, 1.045, 1, 1.035, 0.97] }} transition={{ duration: 12, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }} />
      <motion.img className={styles.earth} src={earth} alt="" fetchPriority="high" animate={transitioning ? { rotate: 690, scale: 1.12 } : reducedMotion ? undefined : { rotate: [0, 180, 360] }} transition={transitioning ? { duration: 1.05, ease: [0.18, 0.72, 0.22, 1] } : { duration: 42, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }} />
      <span className={styles.shade} />
      <motion.span className={styles.orbit} animate={transitioning ? { opacity: 0, scale: 1.14 } : reducedMotion ? undefined : { opacity: [0.66, 0.92, 0.76, 1, 0.66], rotate: [-15, -16, -14.5, -15] }} transition={{ duration: 15, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }} />
    </motion.div>
  </div>;
}
