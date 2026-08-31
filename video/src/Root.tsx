import { Composition } from "remotion";
import { FPS, ParityDemo, TOTAL_FRAMES } from "./Demo";

export function RemotionRoot() {
  return (
    <Composition
      id="ParityDemo"
      component={ParityDemo}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
}
