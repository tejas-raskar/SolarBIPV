import { OrbitControls, Sky, useHelper } from '@react-three/drei'
import './App.css'
import { Canvas, useThree } from '@react-three/fiber'
import { DirectionalLightHelper, FogExp2 } from 'three'
import { useEffect, useRef } from 'react'
import { CityModel } from './components/CityModel'
import { RoadModel } from './components/RoadModel'
import { Ground } from './components/Ground'
import CloudLayer from './components/Clouds'
import { Perf } from 'r3f-perf'

const Scene = () => {
  const directionalLightRef = useRef();
  useHelper(directionalLightRef, DirectionalLightHelper, 100, "white");
  const { scene } = useThree();

  useEffect(() => {
    scene.fog = new FogExp2(0xcfecfe, 0.001);
  }, [scene]);
  return (
    <>
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
      <Sky sunPosition={[-1500, 200, 100]} />
      <Ground />
      <group position={[0, 0, 0]}>
        <CityModel />
        <RoadModel />
      </group>
      <CloudLayer count={20} area={500} height={190} />
    </>
  )
}

function App() {
  return (
    <>
      <Canvas camera={{ far: 5000 }} shadows gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false
      }} >
        {/* <Perf position='top-left' /> */}
        <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2.5} minDistance={500} maxDistance={800} />
        <Scene />
      </Canvas>
    </>
  )
}

export default App
