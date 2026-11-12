import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { SRGBColorSpace, CatmullRomCurve3, Group, MathUtils, Vector3 } from "three";
import planeImage from "../../../assets/images/welcome/plane.png";

type Props = { transitioning: boolean; reducedMotion: boolean; entering?: boolean };

export default function FlightPath({ transitioning, reducedMotion, entering = false }: Props) {
  const texture = useTexture(planeImage);
  const textureRef = useRef(texture);
  useEffect(() => {
    textureRef.current.colorSpace = SRGBColorSpace;
    textureRef.current.needsUpdate = true;
  }, []);
  const plane = useRef<Group>(null);
  const flightTime = useRef(0.02);
  const fade = useRef(entering && !reducedMotion ? 0 : 1);
  const entrance = useRef(entering && !reducedMotion ? 0 : 1);
  const planeMaterial = useRef<import("three").MeshBasicMaterial>(null);
  const trailMaterial = useRef<import("three").MeshBasicMaterial>(null);
  const quaternion = useMemo(() => new Vector3(1, 0, 0), []);
  const position = useMemo(() => new Vector3(), []);
  const tangent = useMemo(() => new Vector3(), []);
  const ahead = useMemo(() => new Vector3(), []);
  const path = useMemo(() => new CatmullRomCurve3([
    new Vector3(-1.65, 1.48, -0.92),
    new Vector3(-1.82, 0.95, -0.3),
    new Vector3(-1.36, 0.28, 0.92),
    new Vector3(-0.55, -0.04, 1.46),
    new Vector3(0.58, 0.2, 1.22),
    new Vector3(1.62, 0.84, 0.28),
    new Vector3(1.68, 1.46, -0.86),
    new Vector3(0.75, 2.06, -1.28),
    new Vector3(-0.45, 2.08, -1.2),
  ], true, "centripetal"), []);

  useFrame((_, delta) => {
    if (!plane.current) return;
    if (entering && !reducedMotion) entrance.current = Math.min(1, entrance.current + delta / 0.45);
    const entered = entrance.current * entrance.current * (3 - 2 * entrance.current);
    const speed = reducedMotion ? 0 : transitioning ? 0.21 : 0.026;
    flightTime.current = (flightTime.current + delta * speed) % 1;
    fade.current = transitioning ? MathUtils.damp(fade.current, 0, 2.8, delta) : entered;
    const t = flightTime.current;
    path.getPointAt(t, position);
    path.getTangentAt(t, tangent).normalize();
    path.getTangentAt((t + 0.012) % 1, ahead).normalize();
    const bank = MathUtils.clamp((tangent.x * ahead.y - tangent.y * ahead.x) * 9, -0.24, 0.24);
    plane.current.position.copy(position);
    if (entering && entered < 1) {
      plane.current.position.x = MathUtils.lerp(-2.6, position.x, entered);
      plane.current.position.y = MathUtils.lerp(2.5, position.y, entered);
    }
    plane.current.quaternion.setFromUnitVectors(quaternion, tangent);
    plane.current.rotateX(bank);
    const depthScale = 0.78 + MathUtils.clamp((position.z + 1.4) / 2.9, 0, 1) * 0.48;
    const launchScale = 1 + Math.min(1, (speed - 0.026) / 0.21) * 0.28;
    plane.current.scale.setScalar(depthScale * launchScale);
    plane.current.visible = fade.current > 0.015;
    if (planeMaterial.current) planeMaterial.current.opacity = 0.98 * fade.current;
    if (trailMaterial.current) trailMaterial.current.opacity = 0.28 * fade.current;
  });

  return <group ref={plane} position={path.getPointAt(0.08)}>
    <mesh renderOrder={4}>
      <planeGeometry args={[1.18, 0.55]} />
      <meshBasicMaterial ref={planeMaterial} map={texture} transparent opacity={0} depthWrite={false} toneMapped={false} />
    </mesh>
    <mesh position={[-0.55, -0.04, -0.02]} rotation={[0, 0, 0.08]}>
      <planeGeometry args={[0.88, 0.012]} />
      <meshBasicMaterial ref={trailMaterial} color="#d8e9f6" transparent opacity={0} depthWrite={false} />
    </mesh>
  </group>;
}
