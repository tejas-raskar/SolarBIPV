import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { MeshStandardMaterial, Raycaster, Vector2 } from "three";
import { calculateRooftopArea } from "../utils/rooftopArea";
import { createHighlightMesh } from "../utils/highlightRooftops";
import { calculateBIPV } from "../utils/bipvCalculation";

const buildingMaterial = new MeshStandardMaterial({ color: 0xffffff });
const highlightedMaterial = new MeshStandardMaterial({ color: 0xffa500 });
const DRAG_THRESHOLD = 5;

export const CityModel = ({ date, time, onRooftopAreaChange, showRayVisualization }) => {
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

      if (onRooftopAreaChange) {
        onRooftopAreaChange({ area: 0, bipvPower: 0 });
      }
    }
  }, [selectedBuilding, mainScene]);

  // Calculate BIPV power when date/time changes 
  useEffect(() => {
    if (selectedBuilding && rooftopDataRef.current) {
      const { area, rooftopVertexIndices, weightedNormal } = rooftopDataRef.current;
      const bipvPower = calculateBIPV(selectedBuilding, date, time, mainScene, area, rooftopVertexIndices, weightedNormal, showRayVisualization);
      if (onRooftopAreaChange) {
        onRooftopAreaChange({ area, bipvPower });
      }
    }
  }, [selectedBuilding, date, time, mainScene, onRooftopAreaChange, showRayVisualization]);

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