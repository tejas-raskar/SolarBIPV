import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { MeshStandardMaterial, Raycaster, Vector2 } from "three";
import { calculateRooftopArea } from "../utils/rooftopArea";
import { createHighlightMesh } from "../utils/highlightRooftops";
import { calculateBIPV } from "../utils/bipvCalculation";
import { folder, useControls } from "leva";

const buildingMaterial = new MeshStandardMaterial({ color: 0xffffff });
const highlightedMaterial = new MeshStandardMaterial({ color: 0xffa500 });
const DRAG_THRESHOLD = 5;

export const CityModel = ({ date, time, showRayVisualization }) => {
  const { scene } = useGLTF("/assets/ny_noDecimate.glb");
  const { camera, scene: mainScene } = useThree();
  const raycaster = useRef(new Raycaster());
  const pointer = useRef(new Vector2());
  const prevHoveredBuilding = useRef(null);
  const prevSelectedBuilding = useRef(null);
  const highlightMeshRef = useRef(null);
  const isDragging = useRef(false);
  const startPosition = useRef(new Vector2());
  const potentialSelection = useRef(null);
  const rooftopDataRef = useRef(null);
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const [stats, setStats] = useControls(() => ({
    Results: folder({
      'Rooftop Area': { value: '0.00 m²', disabled: true },
      'Region in Shadow': { value: '0.00 %', disabled: true },
      'BIPV Power': { value: '0.00 kW', disabled: true },
      'Average GHI': { value: '0.00 kWh/m²/da', disabled: true },
      'Average DNI': { value: '0.00 kWh/m²/da', disabled: true },
      'Instantaneous GHI': { value: '0.00 W/m²', disabled: true },
      'Instantaneous DNI': { value: '0.00 W/m²', disabled: true },
      'Effective Irradiance': { value: '0.00 W/m²', disabled: true },
    })
  }));

  useEffect(() => {
    if (scene) {
      scene.scale.set(0.5, 0.5, 0.5);
      scene.position.set(80, 0, 0);
      scene.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          node.material = buildingMaterial;
          node.userData.isBuilding = true;
        }
      });
    }
  }, [scene]);

  // Calculate rooftop area only when selected building changes
  useEffect(() => {
    if (selectedBuilding) {
      rooftopDataRef.current = calculateRooftopArea(selectedBuilding);

      if (highlightMeshRef.current) {
        mainScene.remove(highlightMeshRef.current);
        highlightMeshRef.current.geometry.dispose();
        highlightMeshRef.current.material.dispose();
      }

      const highlightMesh = createHighlightMesh(selectedBuilding, rooftopDataRef.current.rooftopVertexIndices);
      highlightMeshRef.current = highlightMesh;
      mainScene.add(highlightMesh);
    } else {
      rooftopDataRef.current = null;

      if (highlightMeshRef.current) {
        mainScene.remove(highlightMeshRef.current);
        highlightMeshRef.current.geometry.dispose();
        highlightMeshRef.current.material.dispose();
        highlightMeshRef.current = null;
      }
    }
  }, [selectedBuilding, mainScene]);

  // Calculate BIPV power when date/time changes 
  useEffect(() => {
    if (selectedBuilding && rooftopDataRef.current) {
      const { area, rooftopVertexIndices, weightedNormal } = rooftopDataRef.current;
      const bipvPower = calculateBIPV(selectedBuilding, date, time, mainScene, area, rooftopVertexIndices, weightedNormal, showRayVisualization);
      console.log(bipvPower)
      setStats({
        'Rooftop Area': `${area.toFixed(2)} m²`,
        'Region in Shadow': `${typeof bipvPower.shadowFactor === 'number' ? bipvPower.shadowFactor.toFixed(2) : bipvPower.shadowFactor}`,
        'BIPV Power': `${bipvPower.formattedPower}`,
        'Average GHI': `${bipvPower.avgGhi}`,
        'Average DNI': `${bipvPower.avgDni}`,
        'Instantaneous GHI': `${bipvPower.instGhi}`,
        'Instantaneous DNI': `${bipvPower.instDni}`,
        'Effective Irradiance': `${bipvPower.effectiveIrradiance}`,
      })
    }
  }, [selectedBuilding, date, time, mainScene, showRayVisualization]);

  useEffect(() => {
    return () => {
      if (highlightMeshRef.current) {
        mainScene.remove(highlightMeshRef.current);
        highlightMeshRef.current.geometry.dispose();
        highlightMeshRef.current.material.dispose();
        highlightMeshRef.current = null;
      }
    };
  }, [mainScene]);

  const onPointerDown = useCallback((event) => {
    startPosition.current.set(event.clientX, event.clientY);
    isDragging.current = false;
    pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.current.setFromCamera(pointer.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    if (intersects.length > 0 && intersects[0].object.userData.isBuilding) {
      potentialSelection.current = intersects[0].object;
    } else {
      potentialSelection.current = null;
    }
  },
    [camera, scene]
  );

  const onPointerMove = useCallback((event) => {
    if (!isDragging.current) {
      const currentPosition = new Vector2(event.clientX, event.clientY);
      const distance = currentPosition.distanceTo(startPosition.current);
      if (distance > DRAG_THRESHOLD) {
        isDragging.current = true;
      }
    }
    pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.current.setFromCamera(pointer.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    if (intersects.length > 0 && intersects[0].object.userData.isBuilding) {
      setHoveredBuilding(intersects[0].object);
    } else {
      setHoveredBuilding(null);
    }
  },
    [camera, scene]
  );

  const onPointerUp = useCallback(() => {
    if (!isDragging.current) {
      setSelectedBuilding(potentialSelection.current);
    }
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerDown, onPointerMove, onPointerUp]);

  useEffect(() => {
    if (prevHoveredBuilding.current && prevHoveredBuilding.current !== hoveredBuilding && prevHoveredBuilding.current !== selectedBuilding) {
      prevHoveredBuilding.current.material = buildingMaterial;
    }

    if (prevSelectedBuilding.current && prevSelectedBuilding.current !== selectedBuilding && prevSelectedBuilding.current !== hoveredBuilding) {
      prevSelectedBuilding.current.material = buildingMaterial;
    }

    if (hoveredBuilding) {
      hoveredBuilding.material = highlightedMaterial;
    }

    if (selectedBuilding) {
      selectedBuilding.material = highlightedMaterial;
    }

    prevHoveredBuilding.current = hoveredBuilding;
    prevSelectedBuilding.current = selectedBuilding;
  }, [hoveredBuilding, selectedBuilding]);

  return <primitive object={scene} />;
};