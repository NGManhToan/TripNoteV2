import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { DirectionalLight, PointLight } from "three";

type Props = { reducedMotion: boolean };

export default function Lights({ reducedMotion }: Props) {
  const fill = useRef<PointLight>(null);
  const rim = useRef<PointLight>(null);
  const sun = useRef<DirectionalLight>(null);
  useFrame(({ clock }) => {
    if (!fill.current || !rim.current || !sun.current || reducedMotion) return;
    const time = clock.elapsedTime;
    sun.current.intensity = 1.85 + Math.sin(time * 0.035) * 0.08;
    fill.current.intensity = 0.82 + Math.sin(time * 0.045) * 0.055;
    rim.current.intensity = 1.35 + Math.sin(time * 0.032 + 1.6) * 0.09;
    fill.current.position.x = -2.5 + Math.sin(time * 0.025) * 0.1;
  });

  return <>
    <ambientLight intensity={0.54} color="#91b7d6" />
    <hemisphereLight args={["#bfe6f7", "#07101d", 0.68]} />
    <directionalLight ref={sun} position={[-4, 5, 6]} intensity={1.85} color="#ffe3c1" />
    <pointLight ref={fill} position={[-2.5, 1.1, 3.4]} intensity={0.82} distance={8} color="#87c8f0" />
    <pointLight ref={rim} position={[1.8, 2.6, -3.2]} intensity={1.35} distance={9} color="#8fcbed" />
    <pointLight position={[3.6, -2.2, 2.8]} intensity={0.28} distance={7} color="#477ea9" />
  </>;
}
