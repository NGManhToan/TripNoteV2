import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import type { OrthographicCamera } from "three";

type Props = { transitioning: boolean; reducedMotion: boolean };

export default function CameraRig({ transitioning, reducedMotion }: Props) {
  const { camera: activeCamera, size } = useThree();
  const camera = useRef(activeCamera as OrthographicCamera);
  const push = useRef(0);
  const orbit = useRef(0);
  const focusY = useRef(0.05);
  // R3F's orthographic frustum spans two world units at zoom 1.
  const desiredZoom = Math.min(size.width / 4.14, size.height / 8.44, 1.62) * 50;

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    push.current = THREE_SMOOTH(push.current, transitioning ? 1 : 0, delta * (transitioning ? 2.6 : 1.8));
    orbit.current += reducedMotion ? 0 : delta * 0.13;
    const cinematic = reducedMotion ? 0 : 1;
    focusY.current = THREE_SMOOTH(focusY.current, 0.05, delta * 0.7);
    const zoom = desiredZoom * (1 + 0.012 * Math.sin(time * 0.21) + push.current * 0.68);
    camera.current.zoom = THREE_SMOOTH(camera.current.zoom, zoom, delta * 1.2);
    camera.current.updateProjectionMatrix();
    camera.current.position.x = Math.sin(orbit.current) * 0.055 * cinematic;
    camera.current.position.y = Math.sin(orbit.current * 0.73) * 0.045 * cinematic - push.current * 0.34;
    camera.current.position.z = THREE_SMOOTH(camera.current.position.z, 10 - push.current * 1.7, delta * 1.2);
    camera.current.lookAt(0, focusY.current + push.current * 0.14, 0);
    camera.current.rotateZ(Math.sin(orbit.current * 0.55) * 0.002 * cinematic);
  });

  return null;
}

function THREE_SMOOTH(current: number, targetValue: number, amount: number) {
  return current + (targetValue - current) * (1 - Math.exp(-amount));
}
