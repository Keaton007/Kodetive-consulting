"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTransform, type MotionValue } from 'framer-motion';
import { useScrollProgress } from '@/components/interactions/ScrollProvider';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

type Props = { name: string; title: string };

const FRAG = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform float uTime;

  void main() {
    vec2 uv = vUv;
    float dist = distance(uv, uMouse);
    float pull = smoothstep(0.35, 0.0, dist) * 0.012;
    vec2 flow = vec2(
      sin(uv.y * 8.0 + uTime * 0.4),
      cos(uv.x * 8.0 + uTime * 0.3)
    ) * 0.002;
    uv += flow + pull * normalize(uMouse - uv + 1e-4);

    float dissolve = smoothstep(0.0, 0.4, uScroll);
    uv.y += dissolve * 0.15 * (1.0 - vUv.y);
    float alphaCut = step(dissolve, fract(sin(dot(floor(vUv * 80.0), vec2(12.3, 78.1))) * 43758.5));

    vec4 tex = texture2D(uTex, uv);
    float a = tex.a * alphaCut * (1.0 - dissolve * 0.8);
    gl_FragColor = vec4(tex.rgb, a);
  }
`;

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function buildTextTexture(name: string, title: string): THREE.CanvasTexture | null {
  const scale = 2;
  const w = 2048;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#EDE6D6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cx = (w / scale) / 2;
  const cy = (h / scale) / 2;

  ctx.font = '400 220px "Fraunces", serif';
  ctx.fillText(name, cx, cy - 60);

  ctx.font = '400 56px "JetBrains Mono", monospace';
  ctx.fillStyle = '#8A8272';
  ctx.fillText(title, cx, cy + 70);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return tex;
}

function Plane({
  tex,
  mouse,
  scroll,
}: {
  tex: THREE.CanvasTexture;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  scroll: MotionValue<number>;
}) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame((_, dt) => {
    if (!mat.current) return;
    mat.current.uniforms.uTime.value += dt;
    const m = mat.current.uniforms.uMouse.value as THREE.Vector2;
    m.x += (mouse.current.x - m.x) * 0.08;
    m.y += (mouse.current.y - m.y) * 0.08;
    mat.current.uniforms.uScroll.value = scroll.get();
  });
  return (
    <mesh>
      <planeGeometry args={[2, 1]} />
      <shaderMaterial
        ref={mat}
        transparent
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={{
          uTex: { value: tex },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uScroll: { value: 0 },
          uTime: { value: 0 },
        }}
      />
    </mesh>
  );
}

export function HeroShaderText({ name, title }: Props) {
  const reduced = useSiteReducedMotion();
  const progress = useScrollProgress();
  const scrollForShader = useTransform(progress, [0, 0.25], [0, 1]);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const build = () => setTex(buildTextTexture(name, title));
    if (document.fonts?.ready) {
      document.fonts.ready.then(build);
    } else {
      build();
    }
  }, [name, title]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX / window.innerWidth;
      mouse.current.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <>
      <h1 className="sr-only">{name} — {title}</h1>
      {reduced ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[family-name:var(--font-display)] text-[clamp(48px,10vw,160px)] leading-none">{name}</span>
          <span className="mt-4 font-[family-name:var(--font-mono)] text-[14px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">{title}</span>
        </div>
      ) : (
        <div className="absolute inset-0">
          {tex && (
            <Canvas
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
              camera={{ position: [0, 0, 1], fov: 50 }}
            >
              <Plane tex={tex} mouse={mouse} scroll={scrollForShader} />
            </Canvas>
          )}
        </div>
      )}
    </>
  );
}
