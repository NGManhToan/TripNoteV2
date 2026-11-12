import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferGeometry, Float32BufferAttribute, Points } from "three";

type Props = { reducedMotion: boolean };

function random(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export default function Stars({ reducedMotion }: Props) {
  const points = useRef<Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(105 * 3);
    for (let index = 0; index < 105; index += 1) {
      positions[index * 3] = (random(index + 1) - 0.5) * 4.1;
      positions[index * 3 + 1] = (random(index + 19) - 0.5) * 8.9;
      positions[index * 3 + 2] = -1.2 - random(index + 53) * 2.6;
    }
    const value = new BufferGeometry();
    value.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return value;
  }, []);

  useFrame((_, delta) => {
    if (points.current && !reducedMotion) points.current.rotation.y += delta * 0.006;
  });

  return <points ref={points} geometry={geometry}>
    <pointsMaterial color="#d7e6ef" size={0.018} sizeAttenuation transparent opacity={0.58} depthWrite={false} />
  </points>;
}
