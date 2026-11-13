import { AnimatePresence, motion, useDragControls, useReducedMotion } from "framer-motion";
import type { PanInfo } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import styles from "./GlassSheet.module.css";

type GlassSheetProps = { title: string; subtitle?: string; icon?: ReactNode; variant?: "dialog" | "sheet"; dense?: boolean; showClose?: boolean; hideHeader?: boolean; className?: string; onClose: () => void; children: ReactNode };

export function GlassSheet({ title, subtitle, icon, variant = "dialog", dense = false, showClose = true, hideHeader = false, className = "", onClose, children }: GlassSheetProps) {
  const reduceMotion = useReducedMotion();
  const sheetRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const dragControls = useDragControls();
  const dismissOnDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => { if (variant === "sheet" && info.offset.y > 105 && Math.abs(info.offset.x) < 70) onClose(); };
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousOverscroll = body.style.overscrollBehavior;
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    const containTouch = (event: TouchEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) event.preventDefault();
    };
    document.addEventListener("touchmove", containTouch, { passive: false });
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); }
      if (event.key === "Tab" && sheetRef.current) {
        const nodes = [...sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
        if (!nodes.length) { event.preventDefault(); return; }
        const first = nodes[0]!; const last = nodes.at(-1)!;
        if (document.activeElement === sheetRef.current) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.requestAnimationFrame(() => {
      const initialFocus = variant === "sheet" && !showClose ? sheetRef.current : sheetRef.current?.querySelector<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]');
      initialFocus?.focus();
    });
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("touchmove", containTouch);
      body.style.overflow = previousOverflow;
      body.style.overscrollBehavior = previousOverscroll;
      previousFocus?.focus();
    };
  }, [showClose, variant]);

  return (
    <AnimatePresence>
      <motion.div className={`${styles.backdrop} ${variant === "sheet" ? styles.sheetBackdrop : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.1 : 0.2 }} onPointerDown={(event) => { if (event.target === event.currentTarget) event.stopPropagation(); }} onClick={(event) => { if (event.target !== event.currentTarget) return; event.preventDefault(); event.stopPropagation(); onCloseRef.current(); }}>
        <motion.section ref={sheetRef} className={`${styles.dialog} ${variant === "sheet" ? styles.sheet : ""} ${dense ? styles.denseSheet : ""} ${className}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} drag={variant === "sheet" && !reduceMotion ? "y" : false} dragControls={dragControls} dragListener={false} dragDirectionLock dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: .55 }} onDragEnd={dismissOnDrag} initial={reduceMotion ? { opacity: 0 } : variant === "sheet" ? { opacity: 0, y: "100%" } : { opacity: 0, y: 22, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : variant === "sheet" ? { opacity: 0, y: "100%" } : { opacity: 0, y: 14 }} transition={reduceMotion ? { duration: .12 } : variant === "sheet" ? { type: "spring", stiffness: 290, damping: 30 } : { duration: .22 }}>
          {variant === "sheet" && <span className={styles.handle} onPointerDown={(event) => dragControls.start(event)} aria-hidden="true" />}
          {!hideHeader && <header className={styles.dialogHeader}>
            <div className={styles.headingGroup}>{icon && <span className={styles.dialogIcon}>{icon}</span>}<div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></div>
            {showClose && <button type="button" onClick={onClose} aria-label="Đóng">×</button>}
          </header>}
          {children}
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
