import { useGLTF } from "@react-three/drei";
import { MeshStandardMaterial } from "three";

export const CityModel = () => {
    const { scene } = useGLTF('/assets/ny.glb');
    scene.scale.set(0.5, 0.5, 0.5);
    scene.position.set(80, 0, 0);
    if (scene) {
        scene.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true
                node.receiveShadow = true
                node.material = new MeshStandardMaterial({ color: 0xffffff });
            }
        })
    }
    return (
        <primitive object={scene} />
    )
}