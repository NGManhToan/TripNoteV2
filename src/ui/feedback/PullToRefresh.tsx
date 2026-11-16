import { useEffect, useRef } from "react";

const REFRESH_DISTANCE = 96;

function isScrollable(element: HTMLElement) {
  const overflowY = window.getComputedStyle(element).overflowY;
  return /auto|scroll|overlay/.test(overflowY) && element.scrollHeight > element.clientHeight + 2;
}

export default function PullToRefresh() {
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const indicator = indicatorRef.current;
    if (!indicator) return;

    let startX = 0;
    let startY = 0;
    let distance = 0;
    let tracking = false;

    const hideIndicator = () => {
      tracking = false;
      distance = 0;
      indicator.dataset.pulling = "false";
      indicator.dataset.refreshing = "false";
      indicator.style.opacity = "0";
      indicator.style.transform = "translate3d(-50%, -64px, 0)";
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!window.matchMedia("(max-width: 767px)").matches || event.touches.length !== 1) return;
      if (document.querySelector('[aria-modal="true"]')) return;

      const target = event.target;
      if (!(target instanceof Element) || target.closest("input, textarea, select, [contenteditable='true'], [data-no-pull-refresh]")) return;
      for (let element = target.parentElement; element && element !== document.body; element = element.parentElement) {
        if (isScrollable(element) && element.scrollTop > 1) return;
      }
      if (document.scrollingElement && document.scrollingElement.scrollTop > 1) return;

      startX = event.touches[0]!.clientX;
      startY = event.touches[0]!.clientY;
      distance = 0;
      tracking = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      const deltaY = touch.clientY - startY;
      const deltaX = touch.clientX - startX;
      if (deltaY <= 0 || Math.abs(deltaX) > Math.max(18, deltaY * .65)) {
        hideIndicator();
        return;
      }
      if (deltaY < 12) return;

      event.preventDefault();
      distance = Math.min(REFRESH_DISTANCE + 24, deltaY * .88);
      indicator.dataset.pulling = "true";
      indicator.style.opacity = String(Math.min(1, distance / 38));
      indicator.style.transform = `translate3d(-50%, ${Math.max(-8, distance - 64)}px, 0)`;
    };

    const onTouchEnd = () => {
      if (!tracking) return;
      if (distance < REFRESH_DISTANCE) {
        hideIndicator();
        return;
      }
      tracking = false;
      indicator.dataset.refreshing = "true";
      indicator.style.opacity = "1";
      indicator.style.transform = "translate3d(-50%, 12px, 0)";
      window.setTimeout(() => window.location.reload(), 120);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", hideIndicator, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", hideIndicator);
    };
  }, []);

  return <div ref={indicatorRef} className="pullToRefresh" role="status" aria-label="Đang tải lại" />;
}
