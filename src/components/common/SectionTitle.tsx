import type { ReactNode } from "react";
import styles from "./SectionTitle.module.css";

type SectionTitleProps = { eyebrow?: string; title: ReactNode; description?: ReactNode; className?: string };

export default function SectionTitle({ eyebrow, title, description, className }: SectionTitleProps) {
  const classes = [styles.title, className].filter(Boolean).join(" ");
  return (
    <div className={classes}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}
