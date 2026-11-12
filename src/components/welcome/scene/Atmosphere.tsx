import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, BackSide, Vector3, type ShaderMaterial } from "three";
import { timing } from "../../../animations/motion";

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uGlowColor;
  uniform float uGlowOpacity;
  uniform float uReveal;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - max(dot(normalize(vNormal), viewDirection), 0.0), 2.65);
    gl_FragColor = vec4(uGlowColor, rim * uGlowOpacity * uReveal);
  }
`;

const shells = [
  { scale: 1.035, color: new Vector3(0.38, 0.68, 0.88), opacity: 0.2 },
  { scale: 1.11, color: new Vector3(0.2, 0.43, 0.68), opacity: 0.07 },
];

export default function Atmosphere() {
  const materials = useRef<Array<ShaderMaterial | null>>([]);
  const progress = useRef(0);
  useFrame((_, delta) => {
    progress.current = Math.min(1, progress.current + delta / timing.globeReveal);
    materials.current.forEach((material) => { if (material) material.uniforms.uReveal.value = progress.current; });
  });
  return <>
    {shells.map((shell, index) => <mesh key={shell.scale} scale={shell.scale} renderOrder={3 + index}>
      <sphereGeometry args={[1, 72, 56]} />
      <shaderMaterial
        ref={(material) => { materials.current[index] = material; }}
        uniforms={{ uGlowColor: { value: shell.color }, uGlowOpacity: { value: shell.opacity }, uReveal: { value: 0 } }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        blending={AdditiveBlending}
        side={BackSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>)}
  </>;
}
