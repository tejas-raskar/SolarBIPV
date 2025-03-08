import * as THREE from 'three';
import { getTotalDaytime } from './sunPosition';

export interface BipvValue {
  a: number;
  b: number;
  c: number;
  bipvValue: number;
  type: 'Rooftop' | 'Vertical';
}

/**
 * Check if a point is in shadow by casting rays
 */
function isPointInShadow(point: THREE.Vector3, light: THREE.DirectionalLight, scene: THREE.Scene, numRays = 50): number {
  const raycaster = new THREE.Raycaster();
  const direction = new THREE.Vector3().subVectors(light.position, point).normalize();
  let shadowedRays = 0;

  for (let i = 0; i < numRays; i++) {
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01
    );
    const rayDirection = direction.clone().add(offset).normalize();
    raycaster.ray.origin.copy(point);
    raycaster.ray.direction.copy(rayDirection);

    const intersects = raycaster.intersectObject(scene, true);
    const validIntersects = intersects.filter(intersect => {
      if (!intersect.object.name) return true;
      return intersect.object.name !== 'Sky';
    });

    if (validIntersects.length > 0) {
      shadowedRays += 1;
    }
  }

  const shadowFraction = shadowedRays / numRays;
  return shadowFraction;
}

/**
 * Calculate the rooftop area and solar potential of a building
 */
export function calculateRooftopArea(building: THREE.Mesh, light: THREE.DirectionalLight, scene: THREE.Scene): BipvValue[] {
  const ghiElement = document.getElementById("ghi") as HTMLInputElement;
  const dateInputElement = document.getElementById("dateInput") as HTMLInputElement;
  
  const GHI = parseFloat(ghiElement.value || "5.5");
  const dateInput = dateInputElement.value;
  const date = new Date(dateInput);
  const totalDaytime = getTotalDaytime(date);

  const geometry = building.geometry as THREE.BufferGeometry;
  const vertices = geometry.attributes.position.array;
  const indices = geometry.index?.array;

  if (!indices) {
    console.error('Geometry must have an index');
    return [];
  }

  let totalRooftopArea = 0;
  let totalVerticalArea = 0;
  let totalShadowFractionRooftop = 0;
  let totalShadowFractionVertical = 0;
  const bipvValues: BipvValue[] = [];

  /**
   * Calculate the area of a triangle
   */
  function calculateTriangleArea(v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3): number {
    const triangle = new THREE.Triangle(v1, v2, v3);
    return triangle.getArea();
  }

  /**
   * Check if a normal vector is vertical
   */
  function isVertical(normal: THREE.Vector3): boolean {
    const vertical = new THREE.Vector3(0, 1, 0).normalize();
    normal.normalize();
    const angle = normal.angleTo(vertical);
    const tolerance = Math.PI / 180;
    return Math.abs(angle - Math.PI / 2) < tolerance;
  }

  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];

    const v1 = new THREE.Vector3(vertices[a * 3], vertices[a * 3 + 1], vertices[a * 3 + 2]);
    const v2 = new THREE.Vector3(vertices[b * 3], vertices[b * 3 + 1], vertices[b * 3 + 2]);
    const v3 = new THREE.Vector3(vertices[c * 3], vertices[c * 3 + 1], vertices[c * 3 + 2]);

    const triangleArea = calculateTriangleArea(v1, v2, v3);
    const centroid = new THREE.Vector3().add(v1).add(v2).add(v3).divideScalar(3);

    const normal = new THREE.Vector3().crossVectors(
      v2.clone().sub(v1), 
      v3.clone().sub(v1)
    ).normalize();
    
    const shadowFraction = isPointInShadow(centroid, light, scene);

    if (isVertical(normal)) {
      totalVerticalArea += triangleArea;
      totalShadowFractionVertical += shadowFraction * triangleArea;
      const bipvValue = GHI * triangleArea * (1 - shadowFraction) * 0.15;
      bipvValues.push({ a, b, c, bipvValue, type: 'Vertical' });
    } else {
      totalRooftopArea += triangleArea;
      totalShadowFractionRooftop += shadowFraction * triangleArea;
      const bipvValue = GHI * triangleArea * (1 - shadowFraction) * 0.15;
      bipvValues.push({ a, b, c, bipvValue, type: 'Rooftop' });
    }
  }

  const totalArea = totalRooftopArea + totalVerticalArea;
  const totalShadowFraction = (totalShadowFractionRooftop + totalShadowFractionVertical) / totalArea;
  const totalPVValue = GHI * totalArea * (1 - totalShadowFraction) * 0.15;

  const averageShadowFractionRooftop = totalShadowFraction * 0.1753;
  const pvValueRooftop = GHI * totalRooftopArea * (1 - averageShadowFractionRooftop) * 0.15;

  // Update the UI with calculated values
  updateInfoCard(
    building.name || 'Unknown Building',
    totalDaytime,
    totalArea,
    totalRooftopArea,
    totalShadowFraction,
    averageShadowFractionRooftop,
    totalPVValue,
    pvValueRooftop
  );

  return bipvValues;
}

/**
 * Update the info card with calculation results
 */
function updateInfoCard(
  buildingName: string,
  totalDaytime: number,
  totalArea: number,
  totalRooftopArea: number,
  totalShadowFraction: number,
  averageShadowFractionRooftop: number,
  totalPVValue: number,
  pvValueRooftop: number
): void {
  const buildingNameElement = document.getElementById('buildingName');
  const totalDaytimeElement = document.getElementById('totalDaytime');
  const totalAreaElement = document.getElementById('totalArea');
  const rooftopAreaElement = document.getElementById('rooftopArea');
  const shadowFractionElement = document.getElementById('shadowFraction');
  const shadowFractionRooftopElement = document.getElementById('shadowFractionRooftop');
  const pvValueElement = document.getElementById('pvValue');
  const pvValueRooftopElement = document.getElementById('pvValueRooftop');
  const infoCardElement = document.getElementById('infoCard');

  if (buildingNameElement) buildingNameElement.innerText = buildingName;
  if (totalDaytimeElement) totalDaytimeElement.innerText = `Total Daytime: ${totalDaytime.toFixed(2)} hours`;
  if (totalAreaElement) totalAreaElement.innerText = `Total Area (Rooftop + Vertical): ${totalArea.toFixed(2)} sq.m`;
  if (rooftopAreaElement) rooftopAreaElement.innerText = `Rooftop Area: ${totalRooftopArea.toFixed(2)} sq.m`;
  if (shadowFractionElement) shadowFractionElement.innerText = `Average Shadow Fraction Over Total Area: ${totalShadowFraction.toFixed(2)}`;
  if (shadowFractionRooftopElement) shadowFractionRooftopElement.innerText = `Rooftop Shadow Fraction: ${averageShadowFractionRooftop.toFixed(2)}`;
  if (pvValueElement) pvValueElement.innerText = `Total PV Value: ${totalPVValue.toFixed(2)} kWhr`;
  if (pvValueRooftopElement) pvValueRooftopElement.innerText = `PV Value (Rooftop): ${pvValueRooftop.toFixed(2)} kWhr`;

  if (infoCardElement) {
    infoCardElement.style.display = 'block';
  }
} 