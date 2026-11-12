import type { HTMLAttributes, ReactNode } from "react";
import styles from "./GlassCard.module.css";

type Props = HTMLAttributes<HTMLElement> & { children: ReactNode; as?: "article" | "section" | "div" };
export default function GlassCard({ children, as: Tag = "article", className = "", ...props }: Props) {
  return <Tag className={`${styles.card} ${className}`} {...props}>{children}</Tag>;
}
