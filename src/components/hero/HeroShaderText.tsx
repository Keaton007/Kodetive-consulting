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
  uniform vec3 uBgColor;

  void main() {
    vec2 uv = vUv;
    float dist = distance(uv, uMouse);
    float pull = smoothstep(0.35, 0.0, dist) * 0.012;
    vec2 flow = vec2(
      sin(uv.y * 8.0 + uTime * 0.4),
      cos(uv.x * 8.0 + uTime * 0.3)
    ) * 0.002;
    uv += flow + pull * normalize(uMouse - uv + 1e-4);

    vec4 tex = texture2D(uTex, uv);

    // Desaturate toward bg as scroll progresses (gives a "blurred/fade" feel
    // without sampling a real blur). Purely scroll-driven so reverses cleanly.
    float desat = smoothstep(0.0, 1.0, uScroll);
    vec3 rgb = mix(tex.rgb, uBgColor, desat * 0.6);

    float a = tex.a * (1.0 - uScroll);
    gl_FragColor = vec4(rgb, a);
  }
`;

const VERT = /* glsl */`
  varying vec2 vUv;
  uniform float uScroll;
  void main() {
    vUv = uv;
    // Shrink the plane as scroll progresses: 1.0 -> 0.75. Purely scroll-driven.
    float s = mix(1.0, 0.75, uScroll);
    vec3 pos = position * vec3(s, s, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Clamp helper mirroring CSS clamp(min, pref, max).
function clampPx(minPx: number, preferredPx: number, maxPx: number) {
  return Math.max(minPx, Math.min(maxPx, preferredPx));
}

function buildTextTexture({
  name,
  title,
  viewportWidth,
  canvasWidth,
  canvasHeight,
  dpr,
  fgHex,
  mutedHex,
}: {
  name: string;
  title: string;
  viewportWidth: number;
  canvasWidth: number;
  canvasHeight: number;
  dpr: number;
  fgHex: string;
  mutedHex: string;
}): THREE.CanvasTexture | null {
  const c = document.createElement('canvas');
  c.width = canvasWidth;
  c.height = canvasHeight;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.scale(dpr, dpr);

  const cssW = canvasWidth / dpr;
  const cssH = canvasHeight / dpr;

  ctx.clearRect(0, 0, cssW, cssH);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Name: clamp(56, vw*0.11, 220). Shrink further if at the chosen size the
  // rendered text would violate the 8% inset.
  let nameSize = clampPx(56, viewportWidth * 0.11, 220);
  const titleSize = clampPx(18, viewportWidth * 0.028, 56);

  const maxTextWidth = cssW * (1 - 0.08 * 2);

  ctx.font = `400 ${nameSize}px "Fraunces", serif`;
  let measured = ctx.measureText(name).width;
  if (measured > maxTextWidth) {
    nameSize = Math.floor(nameSize * (maxTextWidth / measured));
    ctx.font = `400 ${nameSize}px "Fraunces", serif`;
    measured = ctx.measureText(name).width;
  }

  const cx = cssW / 2;
  const cy = cssH / 2;
  const gap = Math.max(nameSize * 0.28, 24);

  ctx.fillStyle = fgHex;
  ctx.fillText(name, cx, cy - gap * 0.5);

  ctx.font = `400 ${titleSize}px "JetBrains Mono", monospace`;
  ctx.fillStyle = mutedHex;
  ctx.fillText(title, cx, cy + gap * 0.7);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return tex;
}

function hexToLinearRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function readCssVarColor(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function Plane({
  tex,
  mouse,
  scroll,
  bgLinear,
}: {
  tex: THREE.CanvasTexture;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  scroll: MotionValue<number>;
  bgLinear: [number, number, number];
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
          uBgColor: { value: new THREE.Vector3(...bgLinear) },
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
  const [bgLinear, setBgLinear] = useState<[number, number, number]>([0.91, 0.894, 0.859]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const bgHex = readCssVarColor('--bg', '#E8E4DB');
    const fgHex = readCssVarColor('--fg', '#1A1A17');
    const mutedHex = readCssVarColor('--fg-muted', '#6B6459');
    setBgLinear(hexToLinearRgb(bgHex));

    let timer: number | null = null;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const canvasW = Math.floor(vw * dpr);
      const canvasH = Math.floor(vh * 0.5 * dpr);
      setTex(prev => {
        if (prev) prev.dispose();
        return buildTextTexture({
          name,
          title,
          viewportWidth: vw,
          canvasWidth: canvasW,
          canvasHeight: canvasH,
          dpr,
          fgHex,
          mutedHex,
        });
      });
    };

    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(build, 150);
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(build);
    } else {
      build();
    }

    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('resize', schedule);
      if (timer) window.clearTimeout(timer);
    };
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
        <div className="absolute inset-0 flex flex-col items-center justify-center px-[8%]">
          <span className="font-[family-name:var(--font-display)] text-[clamp(56px,11vw,220px)] leading-none text-center">{name}</span>
          <span className="mt-4 font-[family-name:var(--font-mono)] text-[clamp(12px,2.4vw,18px)] uppercase tracking-[0.2em] text-[var(--fg-muted)]">{title}</span>
        </div>
      ) : (
        <div className="absolute inset-0">
          {tex && (
            <Canvas
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
              camera={{ position: [0, 0, 1], fov: 50 }}
            >
              <Plane tex={tex} mouse={mouse} scroll={scrollForShader} bgLinear={bgLinear} />
            </Canvas>
          )}
        </div>
      )}
    </>
  );
}
