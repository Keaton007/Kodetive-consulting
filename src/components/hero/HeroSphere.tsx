"use client";
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense } from 'react';

export default function HeroSphere() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <Environment files="/env/hero.hdr" />
          <ambientLight intensity={0.15} />
          <directionalLight position={[2, 2, 2]} intensity={0.6} color="#6FB6FF" />
          <mesh>
            <icosahedronGeometry args={[1, 4]} />
            <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.12} />
          </mesh>
        </Suspense>
      </Canvas>
    </div>
  );
}
