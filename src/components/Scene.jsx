import { OrbitControls, Sky, useHelper } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { DirectionalLightHelper, FogExp2 } from "three";
import { CityModel } from "./CityModel";
import { RoadModel } from "./RoadModel";
import { Vegetation } from "./Vegetation";
import { CloudLayer } from "./Clouds";
import { Ground } from "./Ground";

export const Scene = () => {
 
  // Directional Light
  const directionalLightRef = useRef();
  useHelper(directionalLightRef, DirectionalLightHelper, 100, "white");
  
  // Fog
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new FogExp2(0xcfecfe, 0.001);
  }, [scene]);

  return (
    <>
      <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} minDistance={500} maxDistance={800} />
      <ambientLight intensity={0.8} />
      <directionalLight
        color={"orange"}
        position={[-1500, 200, 100]}
        intensity={4}
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
      <Sky sunPosition={[-1500, 200, 100]} />
      <Ground />
      <group position={[150, 0, -80]}>
        <CityModel />
        <RoadModel />
        <Vegetation />
        <CloudLayer count={20} area={500} height={190} />
      </group>
    </>
  )
}
