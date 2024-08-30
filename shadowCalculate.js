import * as THREE from 'three';

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
  
      if (intersects.length > 0) {
        shadowedRays += 1;
      }
    }
  
    const shadowFraction = shadowedRays / numRays;
    return shadowFraction;
}


export function calculateRooftopArea(building, light, scene) {
    const GHI = document.getElementById("ghi").value;
  
    const geometry = building.geometry;
    const vertices = geometry.attributes.position.array;
    const indices = geometry.index.array;
  
    let totalArea = 0;
    let totalShadowFraction = 0;
  
    function calculateTriangleArea(v1, v2, v3) {
      const triangle = new THREE.Triangle(v1, v2, v3);
      return triangle.getArea();
    }
  
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i];
      const b = indices[i + 1];
      const c = indices[i + 2];
  
      const v1 = new THREE.Vector3(vertices[a * 3], vertices[a * 3 + 1], vertices[a * 3 + 2]);
      const v2 = new THREE.Vector3(vertices[b * 3], vertices[b * 3 + 1], vertices[b * 3 + 2]);
      const v3 = new THREE.Vector3(vertices[c * 3], vertices[c * 3 + 1], vertices[c * 3 + 2]);
  
      const triangleArea = calculateTriangleArea(v1, v2, v3);
      totalArea += triangleArea;
  
      const centroid = new THREE.Vector3()
        .add(v1)
        .add(v2)
        .add(v3)
        .divideScalar(3);
  
      const shadowFraction = isPointInShadow(centroid, light, scene);
      totalShadowFraction += shadowFraction * triangleArea;
    }
  
    const averageShadowFraction = totalShadowFraction / totalArea;
    const pvValue = GHI * totalArea * (1 - averageShadowFraction);
  
    document.getElementById('buildingName').innerText = `${building.name}`;
    document.getElementById('totalArea').innerText = `Total Rooftop Area: ${totalArea.toFixed(2)}`;
    document.getElementById('shadowFraction').innerText = `Average Shadow Fraction Over Area: ${averageShadowFraction.toFixed(2)}`;
    document.getElementById('pvValue').innerText = `PV Value: ${pvValue.toFixed(2)}`;
  
    
    document.getElementById('infoCard').style.display = 'block';
  }
  