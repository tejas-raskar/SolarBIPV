import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface UseThreeOptions {
  antialias?: boolean;
  alpha?: boolean;
  width?: number;
  height?: number;
}

interface UseThreeReturn {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isInitialized: boolean;
}

/**
 * Custom hook to initialize Three.js in a Next.js component
 */
export function useThree(options: UseThreeOptions = {}): UseThreeReturn {
  const {
    antialias = true,
    alpha = false,
    width = typeof window !== 'undefined' ? window.innerWidth : 800,
    height = typeof window !== 'undefined' ? window.innerHeight : 600,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Create refs for Three.js objects to persist between renders
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera>(
    new THREE.PerspectiveCamera(75, width / height, 0.1, 10000)
  );
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Initialize Three.js on component mount
  useEffect(() => {
    // Skip initialization if window is not available (SSR)
    if (typeof window === 'undefined') return;
    
    // Skip if canvas element is not available
    if (!canvasRef.current) return;
    
    // Skip if already initialized
    if (rendererRef.current) return;

    // Initialize renderer
    rendererRef.current = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias,
      alpha,
    });
    
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(width, height);
    rendererRef.current.shadowMap.enabled = true;
    rendererRef.current.shadowMap.type = THREE.PCFSoftShadowMap;

    // Update camera aspect ratio
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();

    // Handle window resize
    const handleResize = () => {
      if (!rendererRef.current) return;
      
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [alpha, antialias, height, width]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current!,
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    isInitialized,
  };
} 