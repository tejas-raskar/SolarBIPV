import { Canvas } from "@react-three/fiber";
import { folder, useControls } from "leva";
import { Perf } from "r3f-perf";
import { Scene } from "../components/Scene";

export const Model = () => {
  const { showStats } = useControls({
    Debug: folder({
      showStats: {
        value: false,
      },
    }),
  });
  return (
    <>
      <Canvas
        camera={{ far: 5000, position: [-500, 50, -50] }}
        shadows
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          alpha: false,
        }}
      >
        {showStats ? <Perf position="top-left" /> : null}
        <Scene />
      </Canvas>
    </>
  );
};
