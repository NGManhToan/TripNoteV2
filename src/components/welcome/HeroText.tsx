import { motion, useReducedMotion } from "framer-motion";
import { Camera } from "lucide-react";
import styles from "./HeroText.module.css";

type Props = { transitioning: boolean; identityStep: number };

export default function HeroText({ transitioning, identityStep }: Props) {
  const reducedMotion = useReducedMotion();
  const reveal = (step: number) => identityStep >= step;

  return <motion.header className={styles.identity} initial={false} animate={transitioning ? { opacity: 0, y: 30, scale: 0.92 } : { opacity: 1, y: 0, scale: 1 }} transition={{ duration: reducedMotion ? 0.2 : 0.8, ease: [0.16, 1, 0.3, 1] }}>
    <motion.span className={styles.camera} initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.92 }} animate={reveal(1) ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.92 }} transition={{ duration: reducedMotion ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}>
      <Camera aria-hidden="true" />
    </motion.span>
    <motion.h1 initial={reducedMotion ? false : { opacity: 0, y: 14 }} animate={reveal(2) ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }} transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}>Trip Note</motion.h1>
    <motion.p initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={reveal(3) ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }} transition={{ duration: reducedMotion ? 0 : 0.44, ease: [0.16, 1, 0.3, 1] }}>Plan <i>·</i> Go <i>·</i> Remember</motion.p>
  </motion.header>;
}
