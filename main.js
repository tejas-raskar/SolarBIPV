import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { updateSunPosition } from './sunPosition';
import { identifyTopFaces, onBuildingClick } from './buildingUtils';

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

const floorGeometry = new THREE.PlaneGeometry(3000, 2500);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; 
floor.receiveShadow = true; 
scene.add(floor);

const control = new OrbitControls(camera, renderer.domElement);
const buildings = [];

const loader = new GLTFLoader();
loader.load('cityMap(separateObjects).glb', function (gltf) {
  gltf.scene.traverse(function (node) {
    if (node.isMesh) {
      node.name = node.name || `Mesh ${buildings.length + 1}`; 
      buildings.push(node);
      identifyTopFaces(node);
      node.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      node.castShadow = true; 
      node.receiveShadow = true; 
    }
  });
  scene.add(gltf.scene);
}, undefined, function (error) {
  console.log(error);
});

document.getElementById('updateSunPosition').addEventListener('click', () => updateSunPosition(light));

window.addEventListener('click', (event) => onBuildingClick(event, camera, buildings, light, scene));

function animate() {
  requestAnimationFrame(animate);
  control.update();
  renderer.render(scene, camera);
}
animate();