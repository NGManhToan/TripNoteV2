import { motion, useReducedMotion } from "framer-motion";
import styles from "./BackgroundEffects.module.css";

type Props = { transitioning: boolean };

export default function BackgroundEffects({ transitioning }: Props) {
  const reducedMotion = useReducedMotion();
  const atmosphere = transitioning
    ? { scale: 1.16, opacity: 1, x: "0%" }
    : reducedMotion
      ? {}
      : { x: ["-2%", "1.2%", "2.2%", "-0.8%", "-2%"], y: ["0%", "-1%", "1%", "0%"], opacity: [0.56, 0.82, 0.7, 0.9, 0.56] };

  return <div className={styles.background} aria-hidden="true">
    <motion.div className={styles.aurora} animate={atmosphere} transition={transitioning ? { duration: 0.9, ease: [0.18, 0.72, 0.22, 1] } : { duration: 34, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }} />
    <motion.div className={styles.ray} animate={transitioning ? { opacity: 0.84, scale: 1.3 } : reducedMotion ? undefined : { opacity: [0.14, 0.27, 0.19, 0.34, 0.14], rotate: [-3, -1, 1, -2, -3] }} transition={{ duration: 24, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }} />
    <div className={styles.horizon} />
    <div className={styles.reflection} />
    <div className={styles.noise} />
    <div className={styles.vignette} />
    <div className={styles.stars} />
    <motion.div className={styles.dust} animate={transitioning ? { opacity: 0, y: -22, scale: 1.3 } : reducedMotion ? undefined : { y: [0, -14, -6, 8, 0], x: [0, 4, -3, 2, 0], opacity: [0.14, 0.36, 0.23, 0.4, 0.14] }} transition={{ duration: 19, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }} />
    <motion.div className={styles.launchGlow} animate={{ opacity: transitioning ? 0.42 : 0 }} transition={{ duration: reducedMotion ? 0.12 : 0.82, ease: [0.18, 0.72, 0.22, 1] }} />
  </div>;
}
