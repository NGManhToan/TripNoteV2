import { useReducedMotion } from "framer-motion";
import { cameraIdle } from "../animations/camera";

export function useCamera(transitioning: boolean) {
  const reducedMotion = useReducedMotion();
  if (transitioning) return { ...cameraIdle, scale: 1.45, opacity: 0 };
  return reducedMotion ? { scale: 1, y: 0, rotate: 0 } : cameraIdle;
}
