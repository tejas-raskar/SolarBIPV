import * as THREE from 'three';
import { calculateRooftopArea } from './shadowCalculate';

/**
 * Identify the top faces of a mesh to determine rooftops
 */
export function identifyTopFaces(mesh: THREE.Mesh): void {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  if (!geometry.isBufferGeometry) {
    console.error('Geometry is not a BufferGeometry');
    return;
  }

  const positionAttribute = geometry.getAttribute('position');
  const index = geometry.getIndex();
  if (!index) {
    console.error('Geometry must have an index');
    return;
  }

  const vertices: THREE.Vector3[] = [];
  for (let i = 0; i < positionAttribute.count; i++) {
    vertices.push(new THREE.Vector3().fromBufferAttribute(positionAttribute, i));
  }

  const maxY = Math.max(...vertices.map(v => v.y));
  const threshold = maxY - 0.1;

  const topFaces: { a: number, b: number, c: number }[] = [];
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
    const rooftopVertices: number[] = [];
    const rooftopIndices: number[] = [];

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
    console.log('No top faces identified for mesh:', mesh.name);
  }
}

// Map to store original materials
const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

/**
 * Highlight a selected building
 */
function highlightBuilding(building: THREE.Mesh): void {
  if (!originalMaterials.has(building)) {
    originalMaterials.set(building, building.material);
  }
  building.material = new THREE.MeshStandardMaterial({ color: 0xffff00 }); 
}

/**
 * Revert a highlighted building to its original material
 */
function revertHighlight(building: THREE.Mesh): void {
  if (originalMaterials.has(building)) {
    building.material = originalMaterials.get(building)!;
    originalMaterials.delete(building);
  }
}

// Track currently highlighted building
let highlightedBuilding: THREE.Mesh | null = null;

/**
 * Calculate color based on value range
 */
function getColorForValue(value: number, min: number, max: number): THREE.Color {
  const ratio = (value - min) / (max - min);
  const startColor = new THREE.Color(0xffa500);
  const endColor = new THREE.Color(0xff4500); 
  return startColor.clone().lerp(endColor, ratio);
}

/**
 * Handle building click event
 */
export function onBuildingClick(
  event: MouseEvent, 
  camera: THREE.Camera, 
  buildings: THREE.Mesh[], 
  light: THREE.DirectionalLight, 
  scene: THREE.Scene
): void {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(buildings);

  if (intersects.length > 0) {
    const building = intersects[0].object as THREE.Mesh;
    if (highlightedBuilding) {
      revertHighlight(highlightedBuilding); 
    }
    highlightBuilding(building); 
    highlightedBuilding = building; 
    const bipvValues = calculateRooftopArea(building, light, scene);

    const geometry = building.geometry as THREE.BufferGeometry;
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    const minBipv = Math.min(...bipvValues.map(v => v.bipvValue));
    const maxBipv = Math.max(...bipvValues.map(v => v.bipvValue));

    bipvValues.forEach(({ a, b, c, bipvValue }) => {
      const color = getColorForValue(bipvValue, minBipv, maxBipv);
      colors[a * 3] = color.r;
      colors[a * 3 + 1] = color.g;
      colors[a * 3 + 2] = color.b;
      colors[b * 3] = color.r;
      colors[b * 3 + 1] = color.g;
      colors[b * 3 + 2] = color.b;
      colors[c * 3] = color.r;
      colors[c * 3 + 1] = color.g;
      colors[c * 3 + 2] = color.b;
    });

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    if (building.material instanceof THREE.Material) {
      (building.material as THREE.MeshStandardMaterial).vertexColors = true;
      building.material.needsUpdate = true;
    }
  }
} 