import { RoundedBox, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { SRGBColorSpace, type Group, type MeshPhysicalMaterial } from "three";

export type CardConfig = {
  src: string;
  position: [number, number, number];
  rotation: [number, number, number];
  seed: number;
  exit: [number, number, number];
};

type Props = { card: CardConfig; transitioning: boolean; reducedMotion: boolean };

export default function FloatingCard3D({ card, transitioning, reducedMotion }: Props) {
  const texture = useTexture(card.src);
  const textureRef = useRef(texture);
  useEffect(() => {
    textureRef.current.colorSpace = SRGBColorSpace;
    textureRef.current.anisotropy = 4;
    textureRef.current.needsUpdate = true;
  }, []);
  const group = useRef<Group>(null);
  const material = useRef<MeshPhysicalMaterial>(null);
  const frameMaterial = useRef<MeshPhysicalMaterial>(null);
  const launch = useRef(0);
  const entrance = useRef(0);
  const cardWidth = 0.88;
  const cardHeight = cardWidth / 0.72;
  const glass = useMemo(() => ({ color: "#c4d7e5", roughness: 0.23, metalness: 0.22, clearcoat: 0.95, clearcoatRoughness: 0.12, transparent: true, opacity: 0.92 }), []);

  useFrame(({ clock }, delta) => {
    if (!group.current || !material.current) return;
    entrance.current = Math.min(1, entrance.current + delta / (0.38 + card.seed * 0.02));
    const entered = entrance.current * entrance.current * (3 - 2 * entrance.current);
    launch.current += ((transitioning ? 1 : 0) - launch.current) * (1 - Math.exp(-delta * (transitioning ? 3.8 : 2.8)));
    const time = clock.elapsedTime * (0.32 + card.seed * 0.035) + card.seed * 1.7;
    const floatX = Math.sin(time * 0.72) * 0.035;
    const floatY = reducedMotion ? 0 : Math.sin(time) * 0.075;
    const floatZ = reducedMotion ? 0 : Math.cos(time * 0.8) * 0.09;
    const progress = launch.current;
    group.current.position.set(
      card.position[0] + floatX + card.exit[0] * progress,
      card.position[1] + floatY + (1 - entered) * 0.2 + card.exit[1] * progress,
      card.position[2] + floatZ + card.exit[2] * progress,
    );
    group.current.rotation.set(
      card.rotation[0] + Math.sin(time * 0.85) * 0.025 + progress * 0.24,
      card.rotation[1] + Math.cos(time * 0.7) * 0.045 + progress * (card.seed % 2 ? -0.32 : 0.32),
      card.rotation[2] + Math.sin(time * 0.65) * 0.018 + progress * (card.seed % 2 ? 0.18 : -0.18),
    );
    const breathe = 1 + Math.sin(time * 0.5) * 0.012;
    const launchScale = 1 - progress * 0.28;
    group.current.scale.setScalar(breathe * launchScale * (0.94 + entered * 0.06));
    material.current.opacity = (0.86 + Math.sin(time * 0.58) * 0.06) * entered * (1 - progress);
    if (frameMaterial.current) frameMaterial.current.opacity = 0.92 * entered * (1 - progress);
  });

  return <group ref={group} position={card.position} rotation={card.rotation}>
    <RoundedBox args={[cardWidth, cardHeight, 0.1]} radius={0.12} smoothness={4} castShadow receiveShadow>
      <meshPhysicalMaterial ref={frameMaterial} {...glass} opacity={0} />
    </RoundedBox>
    <mesh position={[0, 0, 0.056]} renderOrder={2}>
      <planeGeometry args={[cardWidth - 0.09, cardHeight - 0.09]} />
      <meshPhysicalMaterial ref={material} map={texture} roughness={0.35} metalness={0.04} clearcoat={0.54} clearcoatRoughness={0.22} transparent opacity={0.92} depthWrite={false} />
    </mesh>
  </group>;
}
