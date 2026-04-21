"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

const FRAG = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uAccent;

  float hash(vec3 p) { return fract(sin(dot(p, vec3(17.1,113.5,31.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p);
    f = f*f*(3.0-2.0*f);
    float n000 = hash(i + vec3(0,0,0));
    float n100 = hash(i + vec3(1,0,0));
    float n010 = hash(i + vec3(0,1,0));
    float n110 = hash(i + vec3(1,1,0));
    float n001 = hash(i + vec3(0,0,1));
    float n101 = hash(i + vec3(1,0,1));
    float n011 = hash(i + vec3(0,1,1));
    float n111 = hash(i + vec3(1,1,1));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }

  void main() {
    vec2 uv = vUv - 0.5;
    uv.x *= 1.6;
    float t = uTime * 0.08;
    float n = noise(vec3(uv * 1.4, t));
    n = pow(n, 1.6);
    vec3 base = vec3(0.043, 0.039, 0.031);
    vec3 glow = mix(base, uAccent, smoothstep(0.55, 0.95, n) * 0.35);
    gl_FragColor = vec4(glow, 1.0);
  }
`;

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function Plane() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={{
          uTime: { value: 0 },
          uAccent: { value: new THREE.Color('#C9A96A') },
        }}
      />
    </mesh>
  );
}

export default function HeroAmbient() {
  const reduced = useSiteReducedMotion();
  if (reduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 1], fov: 50 }}
      >
        <Plane />
      </Canvas>
    </div>
  );
}
