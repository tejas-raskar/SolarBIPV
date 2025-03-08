'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with no SSR for Three.js component
const SolarScene = dynamic(() => import('./SolarScene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      Loading Solar BIPV Visualization...
    </div>
  ),
});

export default function ClientSolarSceneWrapper() {
  return <SolarScene />;
} 