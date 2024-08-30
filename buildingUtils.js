import * as THREE from 'three';
import { calculateRooftopArea } from './shadowCalculate';

//Identify the rooftops from the mesh
export function identifyTopFaces(mesh) {
    const geometry = mesh.geometry;
    if (!geometry.isBufferGeometry) {
      console.error('Geometry is not a BufferGeometry');
      return;
    }
  
    const positionAttribute = geometry.getAttribute('position');
    const index = geometry.getIndex();
    const vertices = [];
    for (let i = 0; i < positionAttribute.count; i++) {
      vertices.push(new THREE.Vector3().fromBufferAttribute(positionAttribute, i));
    }
  
    const maxY = Math.max(...vertices.map(v => v.y));
    const threshold = maxY - 0.1;
  
    const topFaces = [];
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      const b = index.getX(i + 1);
      const c = index.getX(i + 2);
  
      const vertexA = vertices[a];
      const vertexB = vertices[b];
      const vertexC = vertices[c];
  
      const isTopFace = [vertexA, vertexB, vertexC].every((vertex) => vertex.y >= threshold);
      if (isTopFace) {
        topFaces.push({ a, b, c });
      }
    }
  
    if (topFaces.length > 0) {
      const rooftopGeometry = new THREE.BufferGeometry();
      const rooftopVertices = [];
      const rooftopIndices = [];
  
      topFaces.forEach((face, index) => {
        const vertexA = vertices[face.a];
        const vertexB = vertices[face.b];
        const vertexC = vertices[face.c];
  
        const liftAmount = 0.1;
        rooftopVertices.push(vertexA.x, vertexA.y + liftAmount, vertexA.z);
        rooftopVertices.push(vertexB.x, vertexB.y + liftAmount, vertexB.z);
        rooftopVertices.push(vertexC.x, vertexC.y + liftAmount, vertexC.z);
  
        rooftopIndices.push(index * 3, index * 3 + 1, index * 3 + 2);
      });
    } else {
      console.log('No top faces identified for mesh:', mesh);
    }
  }

// Handle the selection of building
const originalMaterials = new Map();
function highlightBuilding(building) {
  if (!originalMaterials.has(building)) {
    originalMaterials.set(building, building.material);
  }
  building.material = new THREE.MeshBasicMaterial({ color: 0xffff00 }); 
}

function revertHighlight(building) {
  if (originalMaterials.has(building)) {
    building.material = originalMaterials.get(building);
    originalMaterials.delete(building);
  }
}

let highlightedBuilding = null;
export function onBuildingClick(event, camera, buildings, light, scene) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(buildings);

  if (intersects.length > 0) {
    const building = intersects[0].object;
    if (highlightedBuilding) {
      revertHighlight(highlightedBuilding); 
    }
    highlightBuilding(building); 
    highlightedBuilding = building; 
    calculateRooftopArea(building, light, scene);
  }
}