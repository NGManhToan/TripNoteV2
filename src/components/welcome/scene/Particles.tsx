import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferGeometry, Float32BufferAttribute, Points } from "three";

type Props = { reducedMotion: boolean };

export default function Particles({ reducedMotion }: Props) {
  const particles = useRef<Points>(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(34 * 3);
    for (let index = 0; index < 34; index += 1) {
      const angle = index * 2.39996;
      const radius = 1.25 + (index % 5) * 0.27;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 1.5 + 0.55;
      positions[index * 3 + 2] = (index % 7) * 0.42 - 1.1;
    }
    const value = new BufferGeometry();
    value.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return value;
  }, []);

  useFrame(({ clock }, delta) => {
    if (particles.current && !reducedMotion) {
      particles.current.rotation.y += delta * 0.012;
      particles.current.rotation.z = Math.sin(clock.elapsedTime * 0.08) * 0.012;
    }
  });

  return <points ref={particles} geometry={geometry}>
    <pointsMaterial color="#a9c5dc" size={0.024} sizeAttenuation transparent opacity={0.38} depthWrite={false} />
  </points>;
}
