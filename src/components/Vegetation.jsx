import { useGLTF } from "@react-three/drei"

export const Vegetation = () => {
    const { scene } = useGLTF('/assets/ny_vegetation.glb');
    scene.scale.set(0.5, 0.5, 0.5);
    scene.position.set(80, -5.5, 0);
    if (scene) {
        scene.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true
                node.receiveShadow = true
            }
        })
    }
    return (
        <primitive object={scene} />
    )
}