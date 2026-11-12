import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { SRGBColorSpace, type Group, type MeshPhysicalMaterial, type ShaderMaterial } from "three";
import earth from "../../../assets/images/welcome/earth.png";
import { timing } from "../../../animations/motion";
import Atmosphere from "./Atmosphere";
import CloudLayer from "./CloudLayer";

type Props = { transitioning: boolean; reducedMotion: boolean };

const vertexShader = `
  varying vec3 vObjectDirection;
  void main() {
    vObjectDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uEarth;
  uniform float uReveal;
  varying vec3 vObjectDirection;
  void main() {
    vec3 direction = normalize(vObjectDirection);
    vec2 frontUv = vec2(0.486 + direction.x * 0.42, 0.50 - direction.y * 0.46);
    vec2 backUv = vec2(0.486 - direction.x * 0.42, 0.50 - direction.y * 0.46);
    vec4 front = texture2D(uEarth, frontUv);
    vec4 back = texture2D(uEarth, backUv);
    float hemisphere = smoothstep(-0.12, 0.16, direction.z);
    vec4 art = mix(back, front, hemisphere);
    vec3 ocean = vec3(0.018, 0.19, 0.38);
    vec3 color = mix(ocean, art.rgb, art.a);
    vec3 keyLight = normalize(vec3(-0.58, 0.72, 1.1));
    float diffuse = max(dot(direction, keyLight), 0.0);
    float terminator = smoothstep(-0.16, 0.72, diffuse);
    float light = mix(0.34, 1.0, terminator);
    vec3 halfVector = normalize(keyLight + vec3(0.0, 0.0, 1.0));
    float highlight = pow(max(dot(direction, halfVector), 0.0), 42.0) * 0.13;
    color += vec3(0.34, 0.29, 0.22) * highlight;
    gl_FragColor = vec4(color * light, uReveal);
  }
`;

export default function Earth({ transitioning, reducedMotion }: Props) {
  const texture = useTexture(earth);
  const textureRef = useRef(texture);
  useEffect(() => {
    textureRef.current.colorSpace = SRGBColorSpace;
    textureRef.current.needsUpdate = true;
  }, []);
  const group = useRef<Group>(null);
  const bodyMaterial = useRef<MeshPhysicalMaterial>(null);
  const surface = useRef<ShaderMaterial>(null);
  const spin = useRef(0);
  const reveal = useRef(reducedMotion ? 1 : 0.04);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    if (!reducedMotion) reveal.current = Math.min(1, reveal.current + delta / timing.globeReveal);
    if (surface.current) surface.current.uniforms.uReveal.value = reveal.current;
    if (bodyMaterial.current) bodyMaterial.current.opacity = reveal.current;
    const ease = reveal.current * reveal.current * (3 - 2 * reveal.current);
    group.current.scale.setScalar(1.12 * (0.55 + ease * 0.45));
    group.current.visible = reveal.current > 0.002;
    const speed = transitioning ? 1.8 : reducedMotion ? 0 : 0.09;
    spin.current += delta * speed;
    group.current.rotation.y = transitioning ? spin.current : Math.sin(clock.elapsedTime * 0.055) * 0.018;
    group.current.rotation.x = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.038) * 0.01;
  });

  return <group ref={group} position={[0, 0.78, 0]} scale={1.12 * 0.55}>
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[1, 96, 64]} />
      <meshPhysicalMaterial ref={bodyMaterial} color="#17456e" roughness={0.5} metalness={0.06} clearcoat={0.24} clearcoatRoughness={0.36} transparent opacity={reducedMotion ? 1 : 0} />
    </mesh>
    <mesh renderOrder={1}>
      <sphereGeometry args={[1.008, 96, 64]} />
      <shaderMaterial ref={surface} uniforms={{ uEarth: { value: texture }, uReveal: { value: reducedMotion ? 1 : 0 } }} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite />
    </mesh>
    <CloudLayer />
    <Atmosphere />
  </group>;
}
