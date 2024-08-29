import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import SunCalc from 'suncalc';

const latitude = 19.0760;
const longitude = 72.8777;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

camera.position.setZ(30);

const light = new THREE.DirectionalLight(0xffffff, 5);
light.position.set(-1500, 200, 100); 
light.castShadow = true; 


light.shadow.mapSize.width = 4096; 
light.shadow.mapSize.height = 4096; 
light.shadow.camera.near = 0.5; 
light.shadow.camera.far = 5000; 
light.shadow.camera.left = -2000; 
light.shadow.camera.right = 2000; 
light.shadow.camera.top = 2000; 
light.shadow.camera.bottom = -2000; 

scene.add(light);
const helper = new THREE.DirectionalLightHelper( light, 100 );
scene.add( helper );

const floorGeometry = new THREE.PlaneGeometry(2500,2500);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; 
floor.receiveShadow = true; 
scene.add(floor);


const control = new OrbitControls(camera, renderer.domElement);
const buildings = [];

const loader = new GLTFLoader();
loader.load('/cityMap(separateObjects).glb', function (gltf) {
  gltf.scene.traverse(function (node) {
    if (node.isMesh) {
      buildings.push(node);
      identifyAndColorTopFaces(node);
      node.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      node.castShadow = true; 
      node.receiveShadow = true; 
    }
  });
  scene.add(gltf.scene);
}, undefined, function (error) {
  console.log(error);
});

function updateSunPosition() {
  const dateInput = document.getElementById('dateInput').value;
  const timeInput = document.getElementById('timeInput').value;

  if (!dateInput || !timeInput) {
    alert('Please enter both date and time.');
    return;
  }

  const date = new Date(`${dateInput}T${timeInput}`);

  
  const sunPosition = SunCalc.getPosition(date, latitude, longitude);
  
  
  const radius = 1500; 
  const x = radius * Math.cos(sunPosition.azimuth) * Math.cos(sunPosition.altitude);
  const y = radius * Math.sin(sunPosition.altitude);
  const z = radius * Math.sin(sunPosition.azimuth) * Math.cos(sunPosition.altitude);

  light.position.set(x, y, z);
  light.target.position.set(0, 0, 0);

  if (sunPosition.altitude < 0) {
    light.intensity = 0; 
  } else {
    light.intensity = 5; 
  }
}

document.getElementById('updateSunPosition').addEventListener('click', updateSunPosition);

function identifyAndColorTopFaces(mesh) {
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

    rooftopGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rooftopVertices, 3));
    rooftopGeometry.setIndex(rooftopIndices);

    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    const rooftopMesh = new THREE.Mesh(rooftopGeometry, material);
    rooftopMesh.castShadow = false; 
    scene.add(rooftopMesh);
  } else {
    console.log('No top faces identified for mesh:', mesh);
  }
}

function animate() {
  requestAnimationFrame(animate);
  control.update();
  renderer.render(scene, camera);
}
animate();
console.log(buildings);
