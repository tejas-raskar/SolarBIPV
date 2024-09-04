import * as THREE from 'three';
import { getTotalDaytime } from './sunPosition';

function isPointInShadow(point, light, scene, numRays = 50) {
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
    const validIntersects = intersects.filter(intersect => intersect.object.name !== 'Sky');

    if (validIntersects.length > 0) {
      shadowedRays += 1;
    }
  }

  const shadowFraction = shadowedRays / numRays;
  return shadowFraction;
}

export function calculateRooftopArea(building, light, scene) {
  const GHI = parseFloat(document.getElementById("ghi").value);
  const dateInput = document.getElementById("dateInput").value;
  const date = new Date(dateInput);
  const totalDaytime = getTotalDaytime(date);

  const geometry = building.geometry;
  const vertices = geometry.attributes.position.array;
  const indices = geometry.index.array;

  let totalRooftopArea = 0;
  let totalVerticalArea = 0;
  let totalShadowFractionRooftop = 0;
  let totalShadowFractionVertical = 0;
  const bipvValues = [];

  function calculateTriangleArea(v1, v2, v3) {
    const triangle = new THREE.Triangle(v1, v2, v3);
    return triangle.getArea();
  }

  function isVertical(normal) {
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

    const normal = new THREE.Vector3().crossVectors(v2.clone().sub(v1), v3.clone().sub(v1)).normalize();
    const shadowFraction = isPointInShadow(centroid, light, scene);

    if (isVertical(normal)) {
      totalVerticalArea += triangleArea;
      totalShadowFractionVertical += shadowFraction * triangleArea;
      const bipvValue = GHI * triangleArea * (1 - shadowFraction) * 0.15;
      bipvValues.push({ a, b, c, bipvValue, type: 'Vertical' });
    } else {
      totalRooftopArea += triangleArea;
      const shadowFraction1 = isPointInShadow(centroid, light, scene);
      totalShadowFractionRooftop += shadowFraction1 * triangleArea;
      const bipvValue = GHI * triangleArea * (1 - shadowFraction) * 0.15;
      bipvValues.push({ a, b, c, bipvValue, type: 'Rooftop' });
    }
  }

  const totalArea = totalRooftopArea + totalVerticalArea;
  const totalShadowFraction = (totalShadowFractionRooftop + totalShadowFractionVertical) / totalArea;
  const totalPVValue = GHI * totalArea * (1 - totalShadowFraction) * 0.15;

  const averageShadowFractionRooftop = totalShadowFraction*0.1753;
  const pvValueRooftop = GHI * totalRooftopArea * (1 - averageShadowFractionRooftop) * 0.15;

  document.getElementById('buildingName').innerText = `${building.name}`;
  document.getElementById('totalDaytime').innerText = `Total Daytime: ${totalDaytime.toFixed(2)} hours`;
  document.getElementById('totalArea').innerText = `Total Area (Rooftop + Vertical): ${totalArea.toFixed(2)} sq.m`;
  document.getElementById('rooftopArea').innerText = `Rooftop Area: ${totalRooftopArea.toFixed(2)} sq.m`;
  document.getElementById('shadowFraction').innerText = `Average Shadow Fraction Over Total Area: ${totalShadowFraction.toFixed(2)}`;
  document.getElementById('shadowFractionRooftop').innerText = `Rooftop Shadow Fraction: ${averageShadowFractionRooftop.toFixed(2)}`;
  document.getElementById('pvValue').innerText = `Total PV Value: ${totalPVValue.toFixed(2)} kWhr`;
  document.getElementById('pvValueRooftop').innerText = `PV Value (Rooftop): ${pvValueRooftop.toFixed(2)} kWhr`;

  document.getElementById('infoCard').style.display = 'block';

  return bipvValues;
}
