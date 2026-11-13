import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { createPortal } from "react-dom";
import styles from "./ToastViewport.module.css";

type Props = { message: string };

export default function ToastViewport({ message }: Props) {
  const reduced = useReducedMotion();
  return createPortal(<AnimatePresence>
    {message && <motion.div className={styles.toast} role="status" aria-live="polite" initial={reduced ? false : { opacity: 0, y: 12, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .98 }} transition={{ duration: reduced ? 0 : .2 }}>
      <CheckCircle2 aria-hidden="true" />
      <span>{message}</span>
    </motion.div>}
  </AnimatePresence>, document.body);
}
