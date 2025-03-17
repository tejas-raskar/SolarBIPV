import { BufferGeometry, DoubleSide, Float32BufferAttribute, Mesh, MeshBasicMaterial, Vector3 } from "three";

export const createHighlightMesh = (originalMesh, rooftopVertexIndices, offset = 1) => {
    const geometry = originalMesh.geometry;
    const positionAttribute = geometry.attributes.position;
    const indexAttribute = geometry.index;

    const positions = [];
    const indices = [];

    const calculateFaceNormal = (vA, vB, vC) => {
        const edge1 = new Vector3().subVectors(vB, vA);
        const edge2 = new Vector3().subVectors(vC, vA);
        return new Vector3().crossVectors(edge1, edge2).normalize();
    };

    if (indexAttribute) {
        for (let i = 0; i < rooftopVertexIndices.length; i += 3) {
            const a = rooftopVertexIndices[i];
            const b = rooftopVertexIndices[i + 1];
            const c = rooftopVertexIndices[i + 2];

            const vA = new Vector3().fromBufferAttribute(positionAttribute, a);
            const vB = new Vector3().fromBufferAttribute(positionAttribute, b);
            const vC = new Vector3().fromBufferAttribute(positionAttribute, c);

            const normal = calculateFaceNormal(vA, vB, vC);

            vA.addScaledVector(normal, offset);
            vB.addScaledVector(normal, offset);
            vC.addScaledVector(normal, offset);

            const baseIndex = positions.length / 3;
            positions.push(vA.x, vA.y, vA.z);
            positions.push(vB.x, vB.y, vB.z);
            positions.push(vC.x, vC.y, vC.z);
            indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
        }
    }

    const highlightGeometry = new BufferGeometry();
    highlightGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    highlightGeometry.setIndex(indices);

    const highlightMaterial = new MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
        side: DoubleSide,
    });

    const highlightMesh = new Mesh(highlightGeometry, highlightMaterial);

    highlightMesh.matrix.copy(originalMesh.matrixWorld);
    highlightMesh.matrixAutoUpdate = false;

    return highlightMesh;
};