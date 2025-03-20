import { OrbitControls, Sky, Stars, useHelper } from "@react-three/drei";
import { useThree, useLoader } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { DirectionalLightHelper, FogExp2, TextureLoader } from "three";
import { CityModel } from "./CityModel";
import { RoadModel } from "./RoadModel";
import { Vegetation } from "./Vegetation";
import { CloudLayer } from "./Clouds";
import { Ground } from "./Ground";
import { updateLightPosition, useSunControls } from "../utils/sunPosition";
import { folder, useControls } from "leva";

export const Scene = () => {
  // Directional Light
  const directionalLightRef = useRef();
  // useHelper(directionalLightRef, DirectionalLightHelper, 100, "white");
  const { date, time } = useSunControls();
  useEffect(() => {
    if (directionalLightRef.current) {
      updateLightPosition(directionalLightRef.current, date, time);
    }
  }, [date, time]);

  // Fog
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new FogExp2(0xabaeb0, 0.002);
  }, [scene]);

  const { showRays } = useControls({
    Debug: folder({
      showRays: { value: false },
    }),
  });

  const isNight = time >= 1080 || time <= 300; 
  return (
    <>
      <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} minDistance={200} maxDistance={800} />
      {!isNight && (<ambientLight intensity={0.5} />)}
      <directionalLight
        color={"orange"}
        position={[-1500, 200, 100]}
        intensity={3}
        ref={directionalLightRef}
        castShadow={true}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-1000}
        shadow-camera-right={1000}
        shadow-camera-top={1000}
        shadow-camera-bottom={-1000}
        shadow-camera-near={1}
        shadow-camera-far={5000}
      />
      {!isNight && (<Sky sunPosition={directionalLightRef.current ? directionalLightRef.current.position.toArray() : [-1500, 200, 100]} />)}
      {isNight && (
        <Stars
          radius={1500}
          depth={50}
          count={5000}
          factor={100}
          saturation={0}
          fade
        />
      )}
      {/* {isNight && (
        <mesh ref={moonRef}>
          <sphereGeometry args={[5, 32, 32]} />
          <meshStandardMaterial map={moonTexture} />
        </mesh>
      )} */}
      <Ground />
      <group position={[150, 0, -80]}>
        <CityModel date={date} time={time} showRayVisualization={showRays} />
        <RoadModel />
        <Vegetation />
        <CloudLayer count={20} area={500} height={190} />
      </group>
    </>
  );
};