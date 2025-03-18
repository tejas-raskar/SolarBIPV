import { Vector3 } from "three";

export const calculateRooftopArea = (mesh, normalThreshold = 0.5) => {
    const geometry = mesh.geometry;
    const positionAttribute = geometry.attributes.position;
    const indexAttribute = geometry.index;
    let totalArea = 0;
    const rooftopVertexIndices = [];
    const weightedNormal = new Vector3();

    const vA = new Vector3();
    const vB = new Vector3();
    const vC = new Vector3();
    const normal = new Vector3();

    if (indexAttribute) {
        for (let i = 0; i < indexAttribute.count; i += 3) {
            const a = indexAttribute.getX(i);
            const b = indexAttribute.getX(i + 1);
            const c = indexAttribute.getX(i + 2);

            vA.fromBufferAttribute(positionAttribute, a);
            vB.fromBufferAttribute(positionAttribute, b);
            vC.fromBufferAttribute(positionAttribute, c);

            vA.applyMatrix4(mesh.matrixWorld);
            vB.applyMatrix4(mesh.matrixWorld);
            vC.applyMatrix4(mesh.matrixWorld);

            const edge1 = new Vector3().subVectors(vB, vA);
            const edge2 = new Vector3().subVectors(vC, vA);
            normal.crossVectors(edge1, edge2).normalize();

            if (normal.y > normalThreshold) {
                const area = calculateTriangleArea(vA, vB, vC);
                totalArea += area;
                rooftopVertexIndices.push(a, b, c);
                weightedNormal.addScaledVector(normal, area);
            }
        }
    } else {
        for (let i = 0; i < positionAttribute.count; i += 3) {
            vA.fromBufferAttribute(positionAttribute, i);
            vB.fromBufferAttribute(positionAttribute, i + 1);
            vC.fromBufferAttribute(positionAttribute, i + 2);

            vA.applyMatrix4(mesh.matrixWorld);
            vB.applyMatrix4(mesh.matrixWorld);
            vC.applyMatrix4(mesh.matrixWorld);

            const edge1 = new Vector3().subVectors(vB, vA);
            const edge2 = new Vector3().subVectors(vC, vA);
            normal.crossVectors(edge1, edge2).normalize();

            if (normal.y > normalThreshold) {
                const area = calculateTriangleArea(vA, vB, vC);
                totalArea += area;
                rooftopVertexIndices.push(i, i + 1, i + 2);
                weightedNormal.addScaledVector(normal, area);
            }
        }
    }

    if (totalArea > 0) {
        weightedNormal.normalize();
    } else {
        weightedNormal.set(0, 1, 0);
    }

    return { area: totalArea * 4, rooftopVertexIndices, weightedNormal };
};

const calculateTriangleArea = (vA, vB, vC) => {
    const ab = new Vector3().subVectors(vB, vA);
    const ac = new Vector3().subVectors(vC, vA);
    const cross = new Vector3().crossVectors(ab, ac);
    return cross.length() * 0.5;
};