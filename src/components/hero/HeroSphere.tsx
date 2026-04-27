"use client";
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';

const INSTANCE_COUNT = 4000;
const SPHERE_RADIUS = 1.0;
const PARTICLE_RADIUS = 0.022;

function makeFibonacciSphere(count: number, radius: number): Float32Array {
  const out = new Float32Array(count * 3);
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    out[i * 3 + 0] = Math.cos(theta) * r * radius;
    out[i * 3 + 1] = y * radius;
    out[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return out;
}

function gaussian(): number {
  // Box-Muller
  const u = Math.max(Math.random(), 1e-7);
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function makeExplodeField(count: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3 + 0] = gaussian() * 6.0; // wide on X
    out[i * 3 + 1] = gaussian() * 2.5; // narrow on Y
    out[i * 3 + 2] = gaussian() * 3.0; // medium on Z
  }
  return out;
}

function makeSeeds(count: number): Float32Array {
  const out = new Float32Array(count);
  for (let i = 0; i < count; i++) out[i] = Math.random() * 1000;
  return out;
}

function ParticleSphere() {
  const geometry = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(PARTICLE_RADIUS, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = ico.index;
    geo.attributes.position = ico.attributes.position;
    geo.attributes.normal = ico.attributes.normal;
    geo.attributes.uv = ico.attributes.uv;
    geo.setAttribute(
      'aRestPos',
      new THREE.InstancedBufferAttribute(makeFibonacciSphere(INSTANCE_COUNT, SPHERE_RADIUS), 3),
    );
    geo.setAttribute(
      'aExplodePos',
      new THREE.InstancedBufferAttribute(makeExplodeField(INSTANCE_COUNT), 3),
    );
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(makeSeeds(INSTANCE_COUNT), 1));
    geo.instanceCount = INSTANCE_COUNT;
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      metalness: 1.0,
      roughness: 0.12,
    });
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `
          #include <common>
          attribute vec3 aRestPos;
          attribute vec3 aExplodePos;
          attribute float aSeed;
          `,
        )
        .replace(
          '#include <begin_vertex>',
          `
          vec3 transformed = position + aRestPos;
          `,
        );
    };
    return mat;
  }, []);

  return <mesh geometry={geometry} material={material} />;
}

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
          <ParticleSphere />
        </Suspense>
      </Canvas>
    </div>
  );
}
