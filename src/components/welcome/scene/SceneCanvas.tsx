import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import styles from "./SceneCanvas.module.css";
import Scene from "./Scene";

type Props = { transitioning: boolean; reducedMotion: boolean; stage: number };

export default function SceneCanvas({ transitioning, reducedMotion, stage }: Props) {
  return <div className={styles.canvas} aria-hidden="true">
    <Canvas
      orthographic
      camera={{ position: [0, 0, 10], zoom: 100, near: 0.1, far: 80 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
      performance={{ min: 0.65 }}
      frameloop={reducedMotion && !transitioning ? "demand" : "always"}
    >
      <Scene transitioning={transitioning} reducedMotion={reducedMotion} stage={stage} />
    </Canvas>
  </div>;
}
