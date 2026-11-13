import { createPortal } from "react-dom";
import { BriefcaseBusiness, Compass, Heart, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { DashboardSection } from "./types";
import styles from "./MobileDock.module.css";

const items = [{ label: "Khám phá", Icon: Compass }, { label: "Yêu thích", Icon: Heart }, { label: "Chuyến đi", Icon: BriefcaseBusiness }, { label: "Cá nhân", Icon: UserRound }] as const;
type Props = { active: DashboardSection; compact?: boolean; visible?: boolean; favoriteCount?: number; tripCount?: number; onChange: (section: DashboardSection) => void };
export default function MobileDock({ active, visible = true, favoriteCount = 0, tripCount = 0, onChange }: Props) {
  const dockRef = useRef<HTMLElement>(null);
  const [pendingSection, setPendingSection] = useState<DashboardSection | null>(null);
  const selectedSection = pendingSection ?? active;

  useEffect(() => {
    if (pendingSection === active) setPendingSection(null);
  }, [active, pendingSection]);

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
  return createPortal(<nav ref={dockRef} className={styles.dock} aria-label="Điều hướng chính">{items.map(({ label, Icon }) => {
    const count = label === "Yêu thích" ? favoriteCount : label === "Chuyến đi" ? tripCount : 0;
    const countLabel = label === "Yêu thích" ? "địa điểm yêu thích" : "chuyến đi";
    return <button className={selectedSection === label ? styles.active : styles.item} key={label} type="button" aria-label={count > 0 ? `${label}, ${count} ${countLabel}` : label} aria-current={selectedSection === label ? "page" : undefined} onClick={() => {
      setPendingSection(label);
      onChange(label);
    }}><Icon aria-hidden="true" />{count > 0 && <span className={label === "Chuyến đi" ? styles.tripCount : styles.favoriteCount} aria-hidden="true">{count > 99 ? "99+" : count}</span>}<span>{label}</span></button>;
  })}</nav>, document.body);
}
