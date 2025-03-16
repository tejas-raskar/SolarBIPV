import './App.css'
import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'
import { Perf } from 'r3f-perf'


function App() {
  return (
    <>
      <Canvas camera={{ far: 5000 }} shadows gl={{ antialias: false, powerPreference: "high-performance", alpha: false }} >
        <Perf position='top-left'/>
        <Scene />
      </Canvas>
    </>
  )
}

export default App
