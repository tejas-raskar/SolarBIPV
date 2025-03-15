import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Cloud } from '@react-three/drei';

export const CloudLayer = ({ count, area, height, cullingDistance = 800 }) => {
  const groupRef = useRef();
  const { camera } = useThree();

  const clouds = useMemo(() => {
    const cloudArray = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * area;
      const z = (Math.random() - 0.5) * area;
      const y = height + Math.random() * 120;
      const scale = 8 + Math.random() * 6;
      const speed = 0.05 + Math.random() * 0.05;
      const segments = 16 + Math.floor(Math.random() * 16);
      const rotationSpeed = (Math.random() - 0.5) * 0.02;
      const initialRotation = Math.random() * Math.PI * 2;
      cloudArray.push({
        position: [x, y, z],
        scale,
        speed,
        segments,
        rotationSpeed,
        initialRotation,
        visible: true,
      });
    }
    return cloudArray;
  }, [count, area, height]);

  const updateCloudVisibility = useCallback((cameraPosition, clouds) => {
    clouds.forEach((cloud, index) => {
      const distance = Math.sqrt(
        Math.pow(cameraPosition.x - cloud.position[0], 2) +
        Math.pow(cameraPosition.z - cloud.position[2], 2)
      );
      
      if (groupRef.current?.children[index]) {
        groupRef.current.children[index].visible = distance < cullingDistance;
      }
    });
  }, [cullingDistance]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    updateCloudVisibility(camera.position, clouds);

    groupRef.current.children.forEach((cloud, index) => {
      if (cloud.visible) {
        const { speed, rotationSpeed, initialRotation } = clouds[index];
        cloud.position.x = clouds[index].position[0] + Math.sin(time * speed) * 20;
        cloud.rotation.y = initialRotation + time * rotationSpeed;
      }
    });
  });

  return (
    <group ref={groupRef} position={[-80, 0, 0]}>
      {clouds.map((cloud, index) => (
        <Cloud
          castShadow
          receiveShadow
          key={index}
          position={cloud.position}
          scale={cloud.scale}
          segments={cloud.segments}
          opacity={0.4}
          depthTest={false}
          rotation-y={cloud.initialRotation}
          frustumCulled 
        />
      ))}
    </group>
  );
};

export default React.memo(CloudLayer, (prevProps, nextProps) => {
  return (
    prevProps.count === nextProps.count &&
    prevProps.area === nextProps.area &&
    prevProps.height === nextProps.height &&
    prevProps.cullingDistance === nextProps.cullingDistance
  );
});