'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { updateSunPosition } from '../utils/sunPosition';
import { identifyTopFaces, onBuildingClick } from '../utils/buildingUtils';
import styles from './SolarScene.module.css';

const SolarScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<number>(720); // Default to noon (12:00)
  const [ghi, setGhi] = useState<number>(5.5);
  const [timeLabel, setTimeLabel] = useState<string>('12:00');

  // Store Three.js objects in refs to persist between renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const skyRef = useRef<Sky | null>(null);
  const buildingsRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize the scene
  useEffect(() => {
    // Skip if component is not mounted or already initialized
    if (!canvasRef.current || rendererRef.current) return;

    // Skip server-side rendering
    if (typeof window === 'undefined') return;

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 100, 500);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Initialize directional light (sun)
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
    lightRef.current = light;

    // Add floor with satellite texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/satellite.jpg', (satelliteTexture) => {
      const floorGeometry = new THREE.PlaneGeometry(2620, 1800);
      const floorMaterial = new THREE.MeshStandardMaterial({ map: satelliteTexture });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      floor.position.set(-60, 0, -130);
      scene.add(floor);
    });

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = true;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2.5;
    controls.minDistance = 50;
    controls.maxDistance = 500;
    controlsRef.current = controls;

    // Add sky
    const sky = new Sky();
    sky.scale.setScalar(450000);
    sky.name = 'Sky';
    scene.add(sky);
    scene.fog = new THREE.FogExp2(0xcccccc, 0.0008);
    skyRef.current = sky;

    // Initialize sky uniforms
    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = 5;
    uniforms['rayleigh'].value = 2;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.8;

    // Load GLTF model
    const loader = new GLTFLoader();
    const buildings: THREE.Mesh[] = [];
    loader.load('/cityMap(separateObjects).glb', (gltf) => {
      gltf.scene.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          mesh.name = mesh.name || `Mesh ${buildings.length + 1}`;
          buildings.push(mesh);
          identifyTopFaces(mesh);
          mesh.material = new THREE.MeshStandardMaterial({ color: 0xffffff });
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      scene.add(gltf.scene);
      buildingsRef.current = buildings;
      setLoaded(true);
    }, undefined, (error) => {
      console.error('Error loading model:', error);
    });

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, []);

  // Handle click on buildings
  useEffect(() => {
    if (!loaded || !canvasRef.current) return;

    const handleClick = (event: MouseEvent) => {
      if (
        cameraRef.current && 
        buildingsRef.current.length > 0 && 
        lightRef.current && 
        sceneRef.current &&
        canvasRef.current
      ) {
        onBuildingClick(
          event, 
          cameraRef.current, 
          buildingsRef.current, 
          lightRef.current, 
          sceneRef.current
        );
      }
    };

    canvasRef.current.addEventListener('click', handleClick);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [loaded]);

  // Update sun position when date or time changes
  useEffect(() => {
    if (!loaded || !lightRef.current || !skyRef.current) return;

    const updateSky = (sunPos: { x: number, y: number, z: number }) => {
      if (!skyRef.current) return;
      
      const uniforms = skyRef.current.material.uniforms;
      const sun = new THREE.Vector3(sunPos.x, sunPos.y, sunPos.z);
      uniforms['sunPosition'].value.copy(sun);
      
      if (rendererRef.current) {
        rendererRef.current.toneMappingExposure = 0.5;
      }
    };

    // Update time label
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setTimeLabel(formattedTime);

    // Update sun position
    const sunPos = updateSunPosition(lightRef.current);
    if (sunPos) {
      updateSky(sunPos);
    }
  }, [date, time, loaded]);

  // Handle time slider change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(parseInt(e.target.value));
  };

  // Handle date input change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  // Handle GHI input change
  const handleGHIChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGhi(parseFloat(e.target.value));
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.controlsBar}>
        <span className="flex items-center">
          <label htmlFor="dateInput" className="mr-2">Date:</label>
          <input 
            type="date" 
            id="dateInput" 
            value={date} 
            onChange={handleDateChange} 
            className="p-1 rounded text-black"
          />
        </span>
        <span className="flex items-center">
          <label htmlFor="timeSlider" className="mr-2">Time of the day:</label>
          <input 
            type="range" 
            id="timeSlider" 
            min="0" 
            max="1440" 
            step="1" 
            value={time} 
            onChange={handleTimeChange} 
            className="w-40"
          />
          <span id="timeLabel" className="ml-2">{timeLabel}</span>
        </span>
        <span className="flex items-center">
          <label htmlFor="ghi" className="mr-2">GHI:</label>
          <input 
            type="number" 
            id="ghi" 
            value={ghi} 
            onChange={handleGHIChange} 
            step="0.1" 
            className="p-1 rounded w-16 text-black"
          />
        </span>
      </div>
      
      <canvas ref={canvasRef} className={styles.canvas} />
      
      <div id="infoCard" className={styles.infoCard}>
        <h3 id="buildingName" className="text-xl font-bold mb-2"></h3>
        <p id="totalDaytime" className="text-sm"></p>
        <p id="totalArea" className="text-sm"></p>
        <p id="rooftopArea" className="text-sm"></p>
        <p id="shadowFraction" className="text-sm"></p>
        <p id="shadowFractionRooftop" className="text-sm"></p>
        <p id="pvValue" className="text-sm"></p>
        <p id="pvValueRooftop" className="text-sm"></p>
      </div>
    </div>
  );
};

export default SolarScene; 