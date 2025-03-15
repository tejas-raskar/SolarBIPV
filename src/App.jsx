import './App.css'
import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'


function App() {
  return (
    <>
      <Canvas camera={{ far: 5000 }} shadows gl={{
        antialias: false,
        powerPreference: "high-performance",
        alpha: false
      }} >
        {/* <Perf /> */}
        <Scene />
      </Canvas>
    </>
  )
}

export default App
