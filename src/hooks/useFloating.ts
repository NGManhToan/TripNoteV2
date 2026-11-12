import { useReducedMotion } from "framer-motion";

export function useFloating(index = 0) {
  const reducedMotion = useReducedMotion();
  const amplitude = 5 + (index % 3) * 2;
  const depth = [1.025, 0.97, 1.035, 0.98][index % 4];
  const tilt = [1.2, -1.4, -0.9, 1.5][index % 4];

  return reducedMotion
    ? { y: 0, rotate: 0 }
    : {
        y: [0, -amplitude, -amplitude * 0.4, amplitude * 0.35, 0],
        x: [0, index % 2 ? 2 : -2, 1, 0],
        rotate: [0, tilt, tilt * 0.3, -tilt * 0.45, 0],
        scale: [1, depth, 1.01, 0.99, 1],
        opacity: [1, 0.94, 1, 0.97, 1],
      };
}
