"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { MotionValue } from 'framer-motion';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

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

function ParticleSphere({ progress }: { progress: MotionValue<number> }) {
  const reduced = useSiteReducedMotion();
  // Stores the patched shader so useFrame can write uniforms each frame.
  const shaderRef = useRef<{
    uniforms: {
      uExplode: { value: number };
      uTime: { value: number };
    };
  } | null>(null);

  const groupRef = useRef<THREE.Group | null>(null);

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
    ico.dispose();
    return geo;
  }, []);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      metalness: 1.0,
      roughness: 0.12,
    });
    // Fix A: stable cache key so shader compilation isn't shared across patched materials.
    mat.customProgramCacheKey = () => 'particle-sphere-v1';
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uExplode = { value: 0 };
      shader.uniforms.uTime = { value: 0 };
      shader.uniforms.uAccent = { value: new THREE.Color('#6FB6FF') };
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `
          #include <common>
          uniform vec3 uAccent;
          `,
        )
        .replace(
          '#include <opaque_fragment>',
          `
          #include <opaque_fragment>
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), viewDir), 0.0, 1.0), 3.0);
          gl_FragColor.rgb += uAccent * fresnel * 0.55;
          `,
        );
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `
          #include <common>
          uniform float uExplode;
          uniform float uTime;
          attribute vec3 aRestPos;
          attribute vec3 aExplodePos;
          attribute float aSeed;

          float easeOutQuart(float x) {
            return 1.0 - pow(1.0 - x, 4.0);
          }

          vec3 hashJitter(float seed, float t) {
            return vec3(
              sin(seed * 12.9898 + t * 0.6),
              sin(seed * 78.233  + t * 0.4),
              sin(seed * 37.719  + t * 0.5)
            ) * 0.05;
          }
          `,
        )
        // Fix C: replace just the `transformed = position` line, not the whole include —
        // preserves morphtarget/skinning scaffolding inside <begin_vertex>.
        .replace(
          'vec3 transformed = vec3( position );',
          `
          float t = easeOutQuart(uExplode);
          vec3 instanceCenter = mix(aRestPos, aExplodePos, t) + hashJitter(aSeed, uTime) * uExplode;
          vec3 transformed = vec3( position ) + instanceCenter;
          `,
        );
      shaderRef.current = shader as unknown as {
        uniforms: {
          uExplode: { value: number };
          uTime: { value: number };
        };
      };
    };
    return mat;
  }, []);

  // Fix B: dispose imperatively created GPU resources on unmount.
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    const s = shaderRef.current;
    if (!s) return;
    s.uniforms.uTime.value = state.clock.getElapsedTime();
    if (reduced) {
      s.uniforms.uExplode.value = 0;
      return;
    }
    const explode = progress.get();
    s.uniforms.uExplode.value = explode;
    if (groupRef.current) {
      const rotationSpeed = 0.05 * Math.max(0, 1 - explode / 0.15);
      groupRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

const AMBIENT_COUNT = 250;
const AMBIENT_RADIUS = 0.014;
const AMBIENT_SPREAD = 3.5;

function AmbientDroplets() {
  const ref = useRef<THREE.InstancedMesh | null>(null);
  const seeds = useMemo(() => makeSeeds(AMBIENT_COUNT), []);
  const basePositions = useMemo(() => {
    const arr = new Float32Array(AMBIENT_COUNT * 3);
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 2 * AMBIENT_SPREAD;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2 * AMBIENT_SPREAD;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2 * AMBIENT_SPREAD * 0.6;
    }
    return arr;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const seed = seeds[i];
      const x = basePositions[i * 3 + 0] + Math.sin(t * 0.12 + seed) * 0.05;
      const y = basePositions[i * 3 + 1] + Math.cos(t * 0.10 + seed * 1.3) * 0.05;
      const z = basePositions[i * 3 + 2] + Math.sin(t * 0.08 + seed * 0.7) * 0.05;
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, AMBIENT_COUNT]}>
      <icosahedronGeometry args={[AMBIENT_RADIUS, 0]} />
      <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.2} />
    </instancedMesh>
  );
}

export default function HeroSphere({ progress }: { progress: MotionValue<number> }) {
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
          <ParticleSphere progress={progress} />
          <AmbientDroplets />
        </Suspense>
      </Canvas>
    </div>
  );
}
