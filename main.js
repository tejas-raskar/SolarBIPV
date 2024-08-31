import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { updateSunPosition } from './sunPosition';
import { identifyTopFaces, onBuildingClick } from './buildingUtils';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

const textureLoader = new THREE.TextureLoader();
const satelliteTexture = textureLoader.load('satellite.jpg'); 

const floorGeometry = new THREE.PlaneGeometry(2620, 1800);
const floorMaterial = new THREE.MeshStandardMaterial({ map: satelliteTexture });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; 
floor.receiveShadow = true; 
scene.add(floor);


floor.position.set(-60, 0, -130); 
floor.scale.set(1, 1, 1);


const control = new OrbitControls(camera, renderer.domElement);
control.minPolarAngle = 0;
control.maxPolarAngle = Math.PI /2.5; 
control.minDistance = 50; 
control.maxDistance = 500; 

camera.position.set(0, 100, 500);
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

const sky = new Sky();
sky.scale.setScalar(450000);
sky.name = 'Sky';
scene.add(sky);
scene.fog = new THREE.FogExp2(0xcccccc, 0.0008);

const sun = new THREE.Vector3();

const uniforms = sky.material.uniforms;
uniforms['turbidity'].value = 5;
uniforms['rayleigh'].value = 2;
uniforms['mieCoefficient'].value = 0.005;
uniforms['mieDirectionalG'].value = 0.8;


export const sunPosition = {
  azimuth: 0,
  altitude: 0,
};

function updateSky(sunPos) {
  sun.set(sunPos.x, sunPos.y, sunPos.z);
  uniforms['sunPosition'].value.copy(sun);
  renderer.toneMappingExposure = 0.5;
}


updateSky(sunPosition);
document.getElementById('timeSlider').addEventListener('input', (event) => {
  const timeSlider = event.target.value;
  const hours = Math.floor(timeSlider / 60);
  const minutes = timeSlider % 60;
  const timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  document.getElementById('timeLabel').innerText = timeLabel;

  const sunPos = updateSunPosition(light);
  if (sunPos) {
    updateSky(sunPos); 
  }
});


window.addEventListener('click', (event) => onBuildingClick(event, camera, buildings, light, scene));

function animate() {
  requestAnimationFrame(animate);
  control.update();
  renderer.render(scene, camera);
}
animate();