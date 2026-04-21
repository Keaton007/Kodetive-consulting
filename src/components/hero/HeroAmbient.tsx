"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

const THREAD_COUNT = 7;

const FRAG = /* glsl */`
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;       // 0..1, lerped
  uniform vec3 uAccent;
  uniform vec3 uBg;

  // Signed distance to a point in uv space (both already aspect-corrected).
  float threadAlpha(vec2 p, float yBase, float phase, float amp, float freq) {
    // Thread is a sin-curve whose baseline is pulled toward the mouse y.
    float pullY = (uMouse.y - yBase);
    float falloffX = smoothstep(0.9, 0.0, abs(p.x - uMouse.x));
    float curveY = yBase
      + sin(p.x * freq + phase + uTime * 0.35) * amp
      + pullY * 0.18 * falloffX;
    float d = abs(p.y - curveY);
    // Thin line ~0.003, soft falloff.
    return smoothstep(0.012, 0.0, d);
  }

  void main() {
    vec2 uv = vUv;

    // Only render threads in the top 65%. Below that, fully transparent.
    // (Remember: vUv.y = 0 is bottom in three.js planes.)
    float topRegion = smoothstep(0.30, 0.40, uv.y);

    float a = 0.0;
    a += threadAlpha(uv, 0.92, 0.0,  0.035, 5.2);
    a += threadAlpha(uv, 0.84, 1.3,  0.042, 4.1);
    a += threadAlpha(uv, 0.76, 2.4,  0.050, 6.0);
    a += threadAlpha(uv, 0.68, 3.7,  0.038, 4.6);
    a += threadAlpha(uv, 0.60, 4.9,  0.045, 5.5);
    a += threadAlpha(uv, 0.52, 0.7,  0.040, 3.8);
    a += threadAlpha(uv, 0.44, 2.1,  0.032, 5.0);

    a *= topRegion;
    a = clamp(a * 0.22, 0.0, 0.28);

    // Blend forest accent onto transparent bg so it composites cleanly over
    // the page background.
    gl_FragColor = vec4(uAccent, a);
  }
`;

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function readCssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function Threads({
  mouse,
  accent,
  bg,
}: {
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  accent: [number, number, number];
  bg: [number, number, number];
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const last = useRef(0);
  // Cap at ~30 fps.
  const frameInterval = 1 / 30;

  useFrame((state) => {
    if (!mat.current) return;
    const t = state.clock.getElapsedTime();
    if (t - last.current < frameInterval) return;
    last.current = t;
    mat.current.uniforms.uTime.value = t;
    const m = mat.current.uniforms.uMouse.value as THREE.Vector2;
    m.x += (mouse.current.x - m.x) * 0.08;
    m.y += (mouse.current.y - m.y) * 0.08;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        transparent
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={{
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.7) },
          uAccent: { value: new THREE.Vector3(...accent) },
          uBg: { value: new THREE.Vector3(...bg) },
        }}
      />
    </mesh>
  );
}

export default function HeroAmbient() {
  const reduced = useSiteReducedMotion();
  const mouse = useRef({ x: 0.5, y: 0.7 });
  const [colors, setColors] = useState<{
    accent: [number, number, number];
    bg: [number, number, number];
  }>({
    accent: [0.184, 0.290, 0.227],
    bg: [0.91, 0.894, 0.859],
  });

  useEffect(() => {
    setColors({
      accent: hexToRgb01(readCssVar('--accent', '#2F4A3A')),
      bg: hexToRgb01(readCssVar('--bg', '#E8E4DB')),
    });
  }, []);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduced]);

  if (reduced) return null;

  // THREAD_COUNT documents intent — fragment shader calls 7 thread lines.
  void THREAD_COUNT;

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 1], fov: 50 }}
      >
        <Threads mouse={mouse} accent={colors.accent} bg={colors.bg} />
      </Canvas>
    </div>
  );
}
