import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./WelcomeScene.module.css";

const CTA_START_TIME = 6.45;

export default function WelcomeScene() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ctaVisible, setCtaVisible] = useState(Boolean(reducedMotion));
  const ctaIsReady = Boolean(reducedMotion) || ctaVisible;

  useEffect(() => {
    if (!reducedMotion) {
      // Warm the dashboard route while the intro is playing.
      void import("../Dashboard").catch(() => undefined);
    }

    if (reducedMotion) {
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    void video.play().catch(() => setCtaVisible(true));
  }, [reducedMotion]);

  const revealCta = () => {
    if (videoRef.current && videoRef.current.currentTime >= CTA_START_TIME) {
      setCtaVisible(true);
    }
  };

  const startJourney = () => {
    navigate("/home", reducedMotion ? undefined : { state: { welcomeArrival: true } });
  };

  return <main className={styles.page}>
    <video
      ref={videoRef}
      className={styles.video}
      autoPlay={!reducedMotion}
      muted
      playsInline
      preload={reducedMotion ? "none" : "auto"}
      poster="/videos/welcome-poster.jpg"
      onTimeUpdate={revealCta}
      onEnded={() => setCtaVisible(true)}
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src="/videos/welcome-intro.mp4" type="video/mp4" />
    </video>

    <button
      className={styles.ctaHitArea}
      type="button"
      aria-label="Bắt đầu hành trình"
      disabled={!ctaIsReady}
      onClick={startJourney}
    >
      <span className={styles.screenReaderOnly}>Bắt đầu hành trình</span>
    </button>

  </main>;
}
