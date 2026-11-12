import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { SRGBColorSpace, type Sprite, type SpriteMaterial } from "three";
import cloudOne from "../../../assets/images/welcome/cloud-1.png";
import cloudThree from "../../../assets/images/welcome/cloud-3.png";
import { timing } from "../../../animations/motion";

const cloudAssets = [
  { src: cloudOne, position: [-0.18, 0.34, 0.93] as [number, number, number], scale: [0.75, 0.33, 1] as [number, number, number], rotation: -0.23 },
  { src: cloudThree, position: [0.56, -0.11, 0.85] as [number, number, number], scale: [0.55, 0.28, 1] as [number, number, number], rotation: 0.35 },
  { src: cloudOne, position: [-0.64, -0.32, 0.73] as [number, number, number], scale: [0.45, 0.22, 1] as [number, number, number], rotation: 0.1 },
];

export default function CloudLayer() {
  const textures = useTexture(cloudAssets.map((cloud) => cloud.src));
  const texturesRef = useRef(textures);
  const clouds = useRef<Array<Sprite | null>>([]);
  const reveal = useRef(0);
  useEffect(() => {
    texturesRef.current.forEach((texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.needsUpdate = true;
    });
  }, []);
  const materialSettings = useMemo(() => ({ transparent: true, depthWrite: false, color: "#dceaff", opacity: 0.28 }), []);

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    reveal.current = Math.min(1, reveal.current + delta / timing.globeReveal);
    clouds.current.forEach((sprite, index) => {
      if (!sprite) return;
      const cloud = cloudAssets[index];
      const phase = index * 2.1;
      sprite.position.x = cloud.position[0] + Math.sin(time * 0.022 + phase) * 0.012;
      sprite.position.y = cloud.position[1] + Math.cos(time * 0.018 + phase) * 0.009;
      sprite.rotation.z = cloud.rotation + Math.sin(time * 0.016 + phase) * 0.012;
      (sprite.material as SpriteMaterial).opacity = (0.28 + Math.sin(time * 0.025 + phase) * 0.025) * reveal.current;
    });
  });

  return <group>
    {cloudAssets.map((cloud, index) => <sprite key={`${cloud.src}-${index}`} ref={(sprite) => { clouds.current[index] = sprite; }} position={cloud.position} scale={cloud.scale} rotation={[0, 0, cloud.rotation]} renderOrder={2}>
      <spriteMaterial map={textures[index]} {...materialSettings} />
    </sprite>)}
  </group>;
}
