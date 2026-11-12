import { easing, timing } from "./motion";

export const sceneEnter = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.15, ease: easing.cinematic } },
};

export const globeEnter = {
  hidden: { opacity: 0, scale: 0.55, y: 0, rotate: 0 },
  visible: { opacity: 1, scale: 1, y: 0, rotate: 0, transition: { duration: timing.globeReveal, ease: easing.reveal } },
};

export const cardEnter = {
  hidden: { opacity: 0, scale: 0.9, y: 18 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.48, ease: easing.settle } },
};
