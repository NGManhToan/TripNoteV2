import { createPortal } from "react-dom";
import { BriefcaseBusiness, Compass, Heart, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import type { DashboardSection } from "./types";
import styles from "./MobileDock.module.css";

const items = [{ label: "Khám phá", Icon: Compass }, { label: "Yêu thích", Icon: Heart }, { label: "Chuyến đi", Icon: BriefcaseBusiness }, { label: "Cá nhân", Icon: UserRound }] as const;
type Props = { active: DashboardSection; compact?: boolean; visible?: boolean; onChange: (section: DashboardSection) => void };
export default function MobileDock({ active, visible = true, onChange }: Props) {
  const dockRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const scrollContainer = document.getElementById("dashboard-scroll-container");
    const dock = dockRef.current;
    if (!scrollContainer || !dock) return;

    let compact = scrollContainer.scrollTop > 24;
    dock.classList.toggle(styles.compact, compact);
    const updateDock = () => {
      const nextCompact = compact ? scrollContainer.scrollTop > 12 : scrollContainer.scrollTop > 24;
      if (nextCompact === compact) return;
      compact = nextCompact;
      dock.classList.toggle(styles.compact, compact);
    };

    scrollContainer.addEventListener("scroll", updateDock, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", updateDock);
  }, [visible]);

  if (!visible) return null;
  return createPortal(<nav ref={dockRef} className={styles.dock} aria-label="Điều hướng chính">{items.map(({ label, Icon }) => <button className={active === label ? styles.active : styles.item} key={label} type="button" aria-label={label} aria-current={active === label ? "page" : undefined} onClick={() => onChange(label)}><Icon aria-hidden="true" /><span>{label}</span></button>)}</nav>, document.body);
}
