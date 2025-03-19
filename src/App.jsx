import './App.css'
import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'
import { Perf } from 'r3f-perf'
import { folder, useControls } from 'leva'


function App() {
  const { showStats } = useControls({
    Debug: folder({
      showStats: {
        value: false
      }
    })
  })
  return (
    <>
      <Canvas camera={{ far: 5000, position: [-500, 50, -50] }} shadows gl={{ antialias: false, powerPreference: "high-performance", alpha: false }} >
        {showStats ? <Perf position='top-left' /> : null}
        <Scene />
      </Canvas>
    </>
  )
}

export default App
