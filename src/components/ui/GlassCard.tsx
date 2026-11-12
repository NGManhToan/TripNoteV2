import type { HTMLAttributes, ReactNode } from "react";
import styles from "./GlassCard.module.css";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

export default function GlassCard({ children, className, ...props }: GlassCardProps) {
  const classes = [styles.card, className].filter(Boolean).join(" ");
  return <div className={classes} {...props}>{children}</div>;
}
