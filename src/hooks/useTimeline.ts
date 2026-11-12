import { useEffect, useState } from "react";
import { timing } from "../animations/motion";

const milestones = [
  timing.introPlane,
  timing.introCardOne,
  timing.introCardTwo,
  timing.introCardThree,
  timing.introCardFour,
  timing.introLogo,
  timing.introTitle,
  timing.introSubtitle,
  timing.introCta,
  timing.introComplete,
];

export function useTimeline(reducedMotion: boolean | null) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;

    const timers = milestones.map((milestone, index) =>
      window.setTimeout(() => setStage(index + 1), milestone * 1000),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reducedMotion]);

  return reducedMotion ? milestones.length : stage;
}
