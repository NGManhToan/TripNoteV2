import { motion, useReducedMotion } from "framer-motion";
import styles from "./CTAButton.module.css";

type Props = { transitioning: boolean; visible: boolean; onClick: () => void };

export default function CTAButton({ transitioning, visible, onClick }: Props) {
  const reducedMotion = useReducedMotion();
  return <motion.button className={styles.button} type="button" onClick={onClick} disabled={transitioning || !visible} initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.94 }} animate={transitioning ? { opacity: [1, 1, 0], y: [0, 2, -8], scale: [1, 0.88, 1.16] } : visible ? { opacity: 1, y: 0, scale: reducedMotion ? 1 : [1, 1.012, 1] } : { opacity: 0, y: 14, scale: 0.96 }} transition={transitioning ? { duration: reducedMotion ? 0.12 : 1.05, ease: [0.18, 0.72, 0.22, 1] } : visible && !reducedMotion ? { opacity: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, y: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, scale: { duration: 3.8, repeat: Infinity, ease: [0.42, 0, 0.58, 1] } } : { duration: reducedMotion ? 0.2 : 0.3, ease: [0.16, 1, 0.3, 1] }} whileHover={reducedMotion || transitioning || !visible ? undefined : { scale: 1.035, y: -2, boxShadow: "0 0 42px rgba(222,231,236,.38)" }} whileTap={reducedMotion || transitioning || !visible ? undefined : { scale: 0.965, y: 1 }}>
    <span>Bắt đầu hành trình</span>
    <i aria-hidden="true">✦</i>
    <motion.span className={styles.ripple} aria-hidden="true" animate={transitioning ? { scale: [0.2, 2.7], opacity: [0.65, 0] } : { scale: 0.2, opacity: 0 }} transition={{ duration: reducedMotion ? 0.1 : 0.82, ease: [0.16, 1, 0.3, 1] }} />
  </motion.button>;
}
