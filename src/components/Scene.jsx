import { OrbitControls, Sky, useHelper } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { DirectionalLightHelper, FogExp2 } from "three";
import { CityModel } from "./CityModel";
import { RoadModel } from "./RoadModel";
import { Vegetation } from "./Vegetation";
import { CloudLayer } from "./Clouds";
import { Ground } from "./Ground";
import { updateLightPosition, useSunControls } from "../utils/sunPosition";
import { useControls } from "leva";

export const Scene = () => {

  // Directional Light
  const directionalLightRef = useRef();
  useHelper(directionalLightRef, DirectionalLightHelper, 100, "white");
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
    showRays: {
      value: false
    }
  })

  return (
    <>
      <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} minDistance={100} maxDistance={800} />
      <ambientLight intensity={0.8} />
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
      <Sky sunPosition={directionalLightRef.current ? directionalLightRef.current.position.toArray() : [-1500, 200, 100]} />
      <Ground />
      <group position={[150, 0, -80]}>
        <CityModel date={date} time={time} onRooftopAreaChange={({ area, bipvPower }) => console.log(`Area: ${area.toFixed(2)} m², BIPV Power: ${bipvPower.formattedPower}`)} showRayVisualization={showRays} />
        <RoadModel />
        <Vegetation />
        <CloudLayer count={20} area={500} height={190} />
      </group>
    </>
  )
}
