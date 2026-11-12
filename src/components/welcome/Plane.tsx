import { motion, useReducedMotion } from "framer-motion";
import plane from "../../assets/images/welcome/plane.png";
import styles from "./Plane.module.css";

type Props = { transitioning: boolean; entering?: boolean };

export default function Plane({ transitioning, entering = false }: Props) {
  const reducedMotion = useReducedMotion();

  return <motion.div className={styles.orbitPath} aria-hidden="true" initial={entering && !reducedMotion ? { opacity: 0, x: "-18vw", y: "14vh", scale: 0.72, rotate: -18 } : false} animate={transitioning ? { rotate: 34, scale: 1.22, opacity: 0 } : reducedMotion ? undefined : { rotate: [0, 100, 205, 295, 360], scale: [1, 1.035, 0.98, 1.025, 1], opacity: 1, x: 0, y: 0 }} transition={transitioning ? { duration: 0.86, ease: [0.18, 0.72, 0.22, 1] } : { rotate: { duration: 27, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }, scale: { duration: 27, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }, opacity: { duration: entering ? 0.45 : 0.2, ease: [0.16, 1, 0.3, 1] }, x: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }, y: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}>
    <motion.img className={styles.plane} src={plane} alt="" loading="eager" animate={transitioning ? { x: "36vw", y: "-37vh", scale: 1.42, rotate: -7, opacity: 0, filter: "blur(2px)" } : reducedMotion ? undefined : { y: [0, -3, 1, 0], rotate: [-3, -1.5, -5, -2, -3], scale: [1, 1.04, 0.97, 1.025, 1], filter: ["blur(0px)", "blur(.25px)", "blur(0px)"] }} transition={transitioning ? { duration: 0.9, ease: [0.18, 0.72, 0.22, 1] } : { duration: 8.5, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }} />
    <motion.span className={styles.trail} animate={transitioning ? { opacity: 0, scaleX: 1.7 } : reducedMotion ? undefined : { opacity: [0.36, 0.8, 0.48, 0.7, 0.36] }} transition={{ duration: 11, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }} />
  </motion.div>;
}
