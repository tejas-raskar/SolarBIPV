import { useRef } from "react";

export const Ground = () => {
  const groundRef = useRef();

  const radius = 6000;
  const segments = 64;
  return (
    <mesh ref={groundRef} receiveShadow position={[0, -6000, 0]}>
      <sphereGeometry args={[radius, segments, segments, 0, Math.PI * 2, 0, Math.PI / 6]} />
      <meshStandardMaterial color="#E0E6ED" roughness={0.8} metalness={0.1} />
    </mesh>
  );
};