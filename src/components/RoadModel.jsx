import { useGLTF } from "@react-three/drei";
import { MeshStandardMaterial } from "three";

export const RoadModel = () => {
    const gltf = useGLTF('/assets/ny_roads.glb');
    const model = gltf.scene;
    model.scale.set(0.5, 0.5, 0.5);
    model.position.set(80, -5.5, 0);
    if (gltf) {
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true
                node.receiveShadow = true
                node.material = new MeshStandardMaterial({ color: 0xa5a5a5 });
            }
        })
    }
    return (
        <primitive object={model} />
    )
}