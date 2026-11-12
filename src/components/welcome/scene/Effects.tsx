import { Bloom, EffectComposer, HueSaturation, Vignette } from "@react-three/postprocessing";

export default function Effects() {
  return <EffectComposer multisampling={0}>
    <Bloom intensity={0.13} luminanceThreshold={1.02} luminanceSmoothing={0.2} mipmapBlur />
    <HueSaturation hue={-0.01} saturation={0.035} />
    <Vignette offset={0.3} darkness={0.24} />
  </EffectComposer>;
}
