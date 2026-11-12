import { motion, useReducedMotion } from "framer-motion";
import { lazy, Suspense } from "react";
import { cameraTransition } from "../../animations/camera";
import { useCamera } from "../../hooks/useCamera";
import BackgroundEffects from "./BackgroundEffects";
import FloatingCards from "./FloatingCards";
import GlobeScene from "./GlobeScene";
import HeroText from "./HeroText";
import Plane from "./Plane";
const SceneCanvas = lazy(() => import("./scene/SceneCanvas"));
import styles from "./CameraRig.module.css";

type Props = { transitioning: boolean; stage: number };

export default function CameraRig({ transitioning, stage: phase }: Props) {
  const reducedMotion = useReducedMotion();
  const camera = useCamera(transitioning);
  const visibleCards = Math.max(0, Math.min(4, phase - 1));
  const identityStep = phase >= 8 ? 3 : phase >= 7 ? 2 : phase >= 6 ? 1 : 0;

  return <main className={styles.viewport}>
    <BackgroundEffects transitioning={transitioning} />
    <motion.div className={`${styles.camera} ${transitioning ? styles.transitioning : ""}`} animate={transitioning ? cameraTransition : camera} transition={transitioning ? { duration: reducedMotion ? 0.15 : 1.05, ease: [0.18, 0.72, 0.22, 1] } : { duration: 28, repeat: reducedMotion ? 0 : Infinity, ease: [0.42, 0, 0.58, 1] }}>
      <div className={styles.focus}>
        <Suspense fallback={
          <>
            <GlobeScene transitioning={transitioning} />
            {visibleCards > 0 && <FloatingCards visibleCards={visibleCards} transitioning={transitioning} />}
            {phase >= 1 && <Plane transitioning={transitioning} entering />}
          </>
        }>
          <SceneCanvas transitioning={transitioning} reducedMotion={Boolean(reducedMotion)} stage={phase} />
        </Suspense>
        <HeroText transitioning={transitioning} identityStep={identityStep} />
      </div>
    </motion.div>
    <motion.div className={styles.flash} animate={transitioning ? { opacity: [0, 0.08, 0.7, 0.28, 0] } : { opacity: 0 }} transition={{ duration: reducedMotion ? 0.2 : 1.05, ease: [0.42, 0, 0.58, 1] }} aria-hidden="true" />
  </main>;
}
