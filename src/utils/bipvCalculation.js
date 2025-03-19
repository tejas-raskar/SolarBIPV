import * as THREE from 'three';
import { getSunPosition, getAdjustedDateTime, latitude } from './sunPosition';

// Monthly solar data from https://www.solarenergylocal.com/states/new-york/new-york/
const monthlyGHI = [2.0, 2.89, 3.91, 4.77, 5.51, 5.85, 5.85, 5.17, 4.3, 3.03, 2.08, 1.75];
const monthlyDNI = [3.23, 3.89, 3.91, 4.1, 4.16, 4.23, 4.32, 4.18, 4.1, 3.42, 2.79, 2.97]; 

// Calculate instantaneous solar irradiance
function getSolarIrradiance(date, time) {
    const adjustedDateTime = getAdjustedDateTime(date, time);
    const month = adjustedDateTime.getMonth();
    const ghiDaily = monthlyGHI[month];
    const dniDaily = monthlyDNI[month];

    const { altitude } = getSunPosition(date, time);
    const maxAlpha = (90 - latitude + 23.5) * (Math.PI / 180);
    const ghiInstant = altitude > 0 ? (ghiDaily * Math.sin(altitude) / Math.sin(maxAlpha)) * 1000 / 24 : 0;
    const dniInstant = altitude > 0 ? (dniDaily * 1000 / 24) : 0; 

    return { ghi: ghiInstant, dni: dniInstant, ghiDaily, dniDaily };
}

// Get all objects that can cast shadows, excluding visualization objects and the building itself
function findShadowCasters(scene) {
    let casters = [];
    scene.traverse((mesh) => {
        if (mesh.isMesh && mesh.userData.isBuilding && !mesh.userData.isVisualization) {
            casters.push(mesh);
        }
    });
    return casters;
}

// Calculate shadow fraction
function calculateShading(mesh, sunDirection, scene, rooftopVertexIndices, showRays, gridSize = 3) {
    if (!scene || !scene.children) {
        console.error('Invalid scene in calculateShading:', scene);
        return 1;
    }
    if (!mesh.geometry || !rooftopVertexIndices || rooftopVertexIndices.length < 3) {
        console.error('Invalid mesh or vertex indices:', mesh, rooftopVertexIndices);
        return 1;
    }

    clearAllVisualizations(scene);

    const visualizationObjects = [];
    const geometry = mesh.geometry;
    const positionAttribute = geometry.attributes.position;
    const shadowCasters = findShadowCasters(scene);
    let totalWeightedShadow = 0;
    let totalArea = 0;

    const raycaster = new THREE.Raycaster();
    raycaster.far = Infinity;

    // Calculate world-space coordinates for the rooftop face from the geometry coordinates
    const vertices = new Map();
    for (let i = 0; i < rooftopVertexIndices.length; i++) {
        const idx = rooftopVertexIndices[i];
        if (!vertices.has(idx)) {
            const vertex = new THREE.Vector3().fromBufferAttribute(positionAttribute, idx);
            vertex.applyMatrix4(mesh.matrixWorld);
            vertices.set(idx, vertex);
        }
    }

    for (let i = 0; i < rooftopVertexIndices.length; i += 3) {
        const a = rooftopVertexIndices[i];
        const b = rooftopVertexIndices[i + 1];
        const c = rooftopVertexIndices[i + 2];

        const vA = vertices.get(a);
        const vB = vertices.get(b);
        const vC = vertices.get(c);

        const edge1 = new THREE.Vector3().subVectors(vB, vA);
        const edge2 = new THREE.Vector3().subVectors(vC, vA);
        const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
        const area = edge1.cross(edge2).length() * 0.5;

        const samplePoints = generateGridPoints(vA, vB, vC, gridSize);
        let shadedPoints = 0;

        for (const point of samplePoints) {
            const offsetPoint = point.clone().addScaledVector(normal, 1);
            raycaster.set(offsetPoint, sunDirection);
            const intersects = raycaster.intersectObjects(shadowCasters, true);

            const isShaded = intersects.length > 0;
            if (isShaded) shadedPoints++;
            if(showRays) {
                const rayLength = 20;
                const arrowHelper = new THREE.ArrowHelper(
                    sunDirection,
                    offsetPoint,
                    rayLength,
                    isShaded ? 0xff0000 : 0xffff00
                );
                arrowHelper.userData.isVisualization = true;
                scene.add(arrowHelper);
                visualizationObjects.push(arrowHelper);
                allVisualizationObjects.push(arrowHelper);
            }
        }

        const shadowFraction = samplePoints.length > 0 ? shadedPoints / samplePoints.length : 0;

        const SHADOW_THRESHOLD = 0.95;
        const effectiveShadowFraction = shadowFraction >= SHADOW_THRESHOLD ? 1 : shadowFraction;

        totalWeightedShadow += effectiveShadowFraction * area;
        totalArea += area;
    }

    const shadowFactor = totalArea > 0 ? totalWeightedShadow / totalArea : 0;
    if (mesh.userData.prevVisualizations) {
        mesh.userData.prevVisualizations.forEach(obj => {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }
    mesh.userData.prevVisualizations = visualizationObjects;

    return shadowFactor;
}

// Generate grid points on a triangle face for raycasting
function generateGridPoints(vA, vB, vC, gridSize) {
    const points = [];
    for (let i = 0; i <= gridSize; i++) {
        for (let j = 0; j <= gridSize - i; j++) {
            const k = gridSize - i - j;
            if (k >= 0) {
                const u = i / gridSize;
                const v = j / gridSize;
                const w = k / gridSize;
                const point = new THREE.Vector3(
                    u * vA.x + v * vB.x + w * vC.x,
                    u * vA.y + v * vB.y + w * vC.y,
                    u * vA.z + v * vB.z + w * vC.z
                );
                points.push(point);
            }
        }
    }
    return points;
}

let allVisualizationObjects = [];

function clearAllVisualizations(scene) {
  allVisualizationObjects.forEach(obj => {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  });
  
  allVisualizationObjects = [];
  
  scene.traverse((obj) => {
    if (obj.userData && obj.userData.prevVisualizations) {
      obj.userData.prevVisualizations.forEach(visObj => {
        scene.remove(visObj);
        if (visObj.geometry) visObj.geometry.dispose();
        if (visObj.material) visObj.material.dispose();
      });
      obj.userData.prevVisualizations = [];
    }
  });
}

export function calculateBIPV(mesh, date, time, scene, rooftopArea, rooftopVertexIndices, weightedNormal, showRays = false, efficiency = 0.2) {
    const { ghi, dni, ghiDaily, dniDaily } = getSolarIrradiance(date, time);
    const { direction: sunDirection } = getSunPosition(date, time);
    const shadowFactor = calculateShading(mesh, sunDirection, scene, rooftopVertexIndices, showRays);
    const normal = weightedNormal || new THREE.Vector3(0, 1, 0);
    const cosTheta = Math.max(0, normal.dot(sunDirection));

    const direct = dni * cosTheta * (1 - shadowFactor);
    const diffuse = ghi * 0.2;
    const effectiveIrradiance = direct + diffuse;

    const totalPower = effectiveIrradiance * rooftopArea * efficiency;
    const totalPowerKW = totalPower / 1000;
    
    return {
        powerW: totalPower,
        powerKW: parseFloat(totalPowerKW.toFixed(2)),  
        formattedPower: `${totalPowerKW.toFixed(2)} kW`,
        avgGhi: `${ghiDaily} kWh/m²/da`,
        avgDni: `${dniDaily} kWh/m²/da`,
        instGhi: `${ghi.toFixed(5)} W/m²`,
        instDni: `${dni.toFixed(5)} W/m²`,
        effectiveIrradiance: `${effectiveIrradiance.toFixed(4)} W/m²`,
        shadowFactor: `${shadowFactor.toFixed(4)*100} %`, 
    };
}