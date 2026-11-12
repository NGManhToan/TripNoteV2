import { Suspense } from "react";
import { useTexture } from "@react-three/drei";
import earth from "../../../assets/images/welcome/earth.png";
import cloudOne from "../../../assets/images/welcome/cloud-1.png";
import cloudThree from "../../../assets/images/welcome/cloud-3.png";
import photoIslands from "../../../assets/images/welcome/photo-islands.png";
import photoMountains from "../../../assets/images/welcome/photo-mountains.png";
import photoCity from "../../../assets/images/welcome/photo-city.png";
import photoTemple from "../../../assets/images/welcome/photo-temple.png";
import plane from "../../../assets/images/welcome/plane.png";
import CameraRig from "./CameraRig";
import Earth from "./Earth";
import FlightPath from "./FlightPath";
import FloatingCardsGroup from "./FloatingCardsGroup";
import Lights from "./Lights";
import Particles from "./Particles";
import Stars from "./Stars";
import Effects from "./Effects";

type Props = { transitioning: boolean; reducedMotion: boolean; stage: number };

const preload = [earth, cloudOne, cloudThree, photoIslands, photoMountains, photoCity, photoTemple, plane];
useTexture.preload(preload);

export default function Scene({ transitioning, reducedMotion, stage }: Props) {
  return <>
    <CameraRig transitioning={transitioning} reducedMotion={reducedMotion} />
    <Lights reducedMotion={reducedMotion} />
    <Stars reducedMotion={reducedMotion} />
    <Particles reducedMotion={reducedMotion} />
    <Suspense fallback={null}><Earth transitioning={transitioning} reducedMotion={reducedMotion} /></Suspense>
    {stage >= 2 && <Suspense fallback={null}><FloatingCardsGroup transitioning={transitioning} reducedMotion={reducedMotion} visibleCards={Math.min(4, stage - 1)} /></Suspense>}
    {stage >= 1 && <Suspense fallback={null}><FlightPath transitioning={transitioning} reducedMotion={reducedMotion} entering /></Suspense>}
    <Effects />
  </>;
}
