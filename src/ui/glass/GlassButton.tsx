import { motion, useReducedMotion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import styles from "./GlassButton.module.css";

type Props = Omit<HTMLMotionProps<"button">, "children"> & { children: ReactNode; variant?: "primary" | "quiet" };
export default function GlassButton({ children, variant = "quiet", className = "", ...props }: Props) {
  const reduced = useReducedMotion();
  return <motion.button className={`${styles.button} ${variant === "primary" ? styles.primary : styles.quiet} ${className}`} whileHover={reduced ? undefined : { y: -1 }} whileTap={reduced ? undefined : { scale: .98 }} {...props}>{children}</motion.button>;
}
