"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { MotionValue } from 'framer-motion';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

type Controls = {
  isDragging: boolean;
  dragDelta: { x: number; y: number };
  angularVel: { x: number; y: number };
};

const SCALE_MIN = 0.5;
const SCALE_MAX = 1.5;
const DEFAULT_VEL_Y = 0.0008;
const MAX_VEL = 0.008;
const DRAG_SENSITIVITY = 0.005;

const PALETTE = [
  new THREE.Color('#4facfe'),
  new THREE.Color('#6FB6FF'),
  new THREE.Color('#B8DEFF'),
  new THREE.Color('#00f2fe'),
  new THREE.Color('#4484ce'),
];

type NodeRec = {
  pos: THREE.Vector3;
  level: number;
  type: 0 | 1;
  size: number;
  distFromRoot: number;
  connections: { node: NodeRec; strength: number }[];
};

function distance3(a: THREE.Vector3, b: THREE.Vector3) {
  return a.distanceTo(b);
}

function isConnected(a: NodeRec, b: NodeRec) {
  return a.connections.some((c) => c.node === b);
}

function connect(a: NodeRec, b: NodeRec, strength: number) {
  if (isConnected(a, b)) return;
  a.connections.push({ node: b, strength });
  b.connections.push({ node: a, strength });
}

function generateCrystallineSphere(density = 1.0): NodeRec[] {
  const nodes: NodeRec[] = [];
  const root: NodeRec = {
    pos: new THREE.Vector3(0, 0, 0),
    level: 0,
    type: 0,
    size: 2.0,
    distFromRoot: 0,
    connections: [],
  };
  nodes.push(root);

  const layers = 5;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let layer = 1; layer <= layers; layer++) {
    const radius = layer * 4;
    const numPoints = Math.max(6, Math.floor(layer * 12 * density));
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / numPoints);
      const theta = (2 * Math.PI * i) / goldenRatio;
      const pos = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      );
      const isLeaf = layer === layers || Math.random() < 0.3;
      const node: NodeRec = {
        pos,
        level: layer,
        type: isLeaf ? 1 : 0,
        size: isLeaf ? THREE.MathUtils.randFloat(0.5, 1.0) : THREE.MathUtils.randFloat(0.8, 1.4),
        distFromRoot: radius,
        connections: [],
      };
      nodes.push(node);

      if (layer > 1) {
        const prev = nodes.filter((n) => n.level === layer - 1 && n !== root);
        prev.sort((a, b) => distance3(pos, a.pos) - distance3(pos, b.pos));
        for (let j = 0; j < Math.min(3, prev.length); j++) {
          const d = distance3(pos, prev[j].pos);
          const strength = Math.max(0.3, 1 - d / (radius * 2));
          connect(node, prev[j], strength);
        }
      } else {
        connect(node, root, 0.9);
      }
    }

    const layerNodes = nodes.filter((n) => n.level === layer && n !== root);
    for (const node of layerNodes) {
      const nearby = layerNodes
        .filter((n) => n !== node)
        .sort((a, b) => distance3(node.pos, a.pos) - distance3(node.pos, b.pos))
        .slice(0, 5);
      for (const near of nearby) {
        const d = distance3(node.pos, near.pos);
        if (d < radius * 0.8) connect(node, near, 0.6);
      }
    }
  }

  // A few inter-layer "shortcut" links for organic look.
  const outer = nodes.filter((n) => n.level >= 3);
  for (let i = 0; i < Math.min(20, outer.length); i++) {
    const a = outer[Math.floor(Math.random() * outer.length)];
    const b = outer[Math.floor(Math.random() * outer.length)];
    if (a !== b && Math.abs(a.level - b.level) > 1) connect(a, b, 0.4);
  }

  return nodes;
}

const NOISE_GLSL = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

function Starfield() {
  const ref = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = THREE.MathUtils.randFloat(60, 160);
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = Math.random();
      if (c < 0.7) {
        colors[i * 3 + 0] = 1;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 1;
      } else if (c < 0.9) {
        colors[i * 3 + 0] = 0.7;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 1;
      } else {
        colors[i * 3 + 0] = 0.85;
        colors[i * 3 + 1] = 0.95;
        colors[i * 3 + 2] = 1;
      }
      sizes[i] = THREE.MathUtils.randFloat(0.1, 0.3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float uTime;
          void main() {
            vColor = color;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float twinkle = sin(uTime * 2.0 + position.x * 100.0) * 0.3 + 0.7;
            gl_PointSize = size * twinkle * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float a = 1.0 - smoothstep(0.0, 0.5, d);
            gl_FragColor = vec4(vColor, a * 0.7);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();
    if (ref.current) ref.current.rotation.y += 0.0002;
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

function Network({
  controlsRef,
  progress,
}: {
  controlsRef: React.MutableRefObject<Controls>;
  progress: MotionValue<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const reduced = useSiteReducedMotion();

  const network = useMemo(() => generateCrystallineSphere(1.0), []);

  const { nodesGeometry, nodesMaterial } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(network.length * 3);
    const types = new Float32Array(network.length);
    const sizes = new Float32Array(network.length);
    const colors = new Float32Array(network.length * 3);
    const dists = new Float32Array(network.length);
    network.forEach((n, i) => {
      positions[i * 3 + 0] = n.pos.x;
      positions[i * 3 + 1] = n.pos.y;
      positions[i * 3 + 2] = n.pos.z;
      types[i] = n.type;
      sizes[i] = n.size;
      dists[i] = n.distFromRoot;
      const palIdx = Math.min(n.level, PALETTE.length - 1);
      const c = PALETTE[palIdx].clone();
      c.offsetHSL(THREE.MathUtils.randFloatSpread(0.04), THREE.MathUtils.randFloatSpread(0.08), THREE.MathUtils.randFloatSpread(0.08));
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('nodeType', new THREE.BufferAttribute(types, 1));
    geom.setAttribute('nodeSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('nodeColor', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('distFromRoot', new THREE.BufferAttribute(dists, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBaseSize: { value: 0.6 },
      },
      vertexShader: `
        ${NOISE_GLSL}
        attribute float nodeSize;
        attribute float nodeType;
        attribute vec3 nodeColor;
        attribute float distFromRoot;
        uniform float uTime;
        uniform float uBaseSize;
        varying vec3 vColor;
        varying float vNodeType;
        varying float vDistFromRoot;
        varying float vGlow;
        void main() {
          vNodeType = nodeType;
          vColor = nodeColor;
          vDistFromRoot = distFromRoot;
          vGlow = 0.5 + 0.5 * sin(uTime * 0.5 + distFromRoot * 0.2);
          float breathe = sin(uTime * 0.7 + distFromRoot * 0.15) * 0.15 + 0.85;
          vec3 mp = position;
          if (nodeType > 0.5) {
            float n = snoise(position * 0.08 + uTime * 0.08);
            mp += normalize(position) * n * 0.18;
          }
          vec4 mv = modelViewMatrix * vec4(mp, 1.0);
          gl_PointSize = nodeSize * breathe * uBaseSize * (1000.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        varying float vNodeType;
        varying float vDistFromRoot;
        varying float vGlow;
        void main() {
          vec2 c = 2.0 * gl_PointCoord - 1.0;
          float d = length(c);
          if (d > 1.0) discard;
          float glow1 = 1.0 - smoothstep(0.0, 0.5, d);
          float glow2 = 1.0 - smoothstep(0.0, 1.0, d);
          float gs = pow(glow1, 1.2) + glow2 * 0.3;
          float breatheCol = 0.9 + 0.1 * sin(uTime * 0.6 + vDistFromRoot * 0.25);
          vec3 col = vColor * breatheCol;
          float core = smoothstep(0.4, 0.0, d);
          col += vec3(1.0) * core * 0.3;
          float a = gs * (0.95 - 0.3 * d);
          if (vNodeType > 0.5) { col *= 1.1; a *= 0.9; }
          col *= (1.0 + vGlow * 0.1);
          gl_FragColor = vec4(col, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { nodesGeometry: geom, nodesMaterial: mat };
  }, [network]);

  const { connectionsGeometry, connectionsMaterial } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [];
    const startPoints: number[] = [];
    const endPoints: number[] = [];
    const strengths: number[] = [];
    const colors: number[] = [];
    const pathIndices: number[] = [];
    const seen = new Set<string>();
    let pathIdx = 0;
    network.forEach((n, ni) => {
      n.connections.forEach((conn) => {
        const ci = network.indexOf(conn.node);
        if (ci < 0) return;
        const key = ni < ci ? `${ni}-${ci}` : `${ci}-${ni}`;
        if (seen.has(key)) return;
        seen.add(key);
        const segs = 18;
        for (let i = 0; i < segs; i++) {
          const t = i / (segs - 1);
          positions.push(t, 0, 0);
          startPoints.push(n.pos.x, n.pos.y, n.pos.z);
          endPoints.push(conn.node.pos.x, conn.node.pos.y, conn.node.pos.z);
          pathIndices.push(pathIdx);
          strengths.push(conn.strength);
          const lvl = Math.min(Math.floor((n.level + conn.node.level) / 2), PALETTE.length - 1);
          const c = PALETTE[lvl].clone();
          c.offsetHSL(THREE.MathUtils.randFloatSpread(0.04), THREE.MathUtils.randFloatSpread(0.08), THREE.MathUtils.randFloatSpread(0.08));
          colors.push(c.r, c.g, c.b);
        }
        pathIdx++;
      });
    });
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('startPoint', new THREE.Float32BufferAttribute(startPoints, 3));
    geom.setAttribute('endPoint', new THREE.Float32BufferAttribute(endPoints, 3));
    geom.setAttribute('connectionStrength', new THREE.Float32BufferAttribute(strengths, 1));
    geom.setAttribute('connectionColor', new THREE.Float32BufferAttribute(colors, 3));
    geom.setAttribute('pathIndex', new THREE.Float32BufferAttribute(pathIndices, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        ${NOISE_GLSL}
        attribute vec3 startPoint;
        attribute vec3 endPoint;
        attribute float connectionStrength;
        attribute float pathIndex;
        attribute vec3 connectionColor;
        uniform float uTime;
        varying vec3 vColor;
        varying float vStrength;
        varying float vT;
        void main() {
          float t = position.x;
          vT = t;
          vec3 mid = mix(startPoint, endPoint, 0.5);
          float bow = sin(t * 3.14159) * 0.18;
          vec3 dir = endPoint - startPoint;
          vec3 perp = normalize(cross(normalize(dir), vec3(0.0, 1.0, 0.0)));
          if (length(perp) < 0.1) perp = vec3(1.0, 0.0, 0.0);
          mid += perp * bow;
          vec3 p0 = mix(startPoint, mid, t);
          vec3 p1 = mix(mid, endPoint, t);
          vec3 finalPos = mix(p0, p1, t);
          float n = snoise(vec3(pathIndex * 0.08, t * 0.6, uTime * 0.15));
          finalPos += perp * n * 0.12;
          vColor = connectionColor;
          vStrength = connectionStrength;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vColor;
        varying float vStrength;
        varying float vT;
        void main() {
          float flow1 = sin(vT * 25.0 - uTime * 4.0) * 0.5 + 0.5;
          float flow2 = sin(vT * 15.0 - uTime * 2.5 + 1.57) * 0.5 + 0.5;
          float flow = (flow1 + flow2 * 0.5) / 1.5;
          vec3 base = vColor * (0.8 + 0.2 * sin(uTime * 0.6 + vT * 12.0));
          float intensity = 0.4 * flow * vStrength;
          vec3 col = base * (0.7 + intensity + vStrength * 0.5);
          float a = 0.7 * vStrength + flow * 0.3;
          gl_FragColor = vec4(col, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { connectionsGeometry: geom, connectionsMaterial: mat };
  }, [network]);

  useEffect(() => {
    return () => {
      nodesGeometry.dispose();
      nodesMaterial.dispose();
      connectionsGeometry.dispose();
      connectionsMaterial.dispose();
    };
  }, [nodesGeometry, nodesMaterial, connectionsGeometry, connectionsMaterial]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    nodesMaterial.uniforms.uTime.value = t;
    connectionsMaterial.uniforms.uTime.value = t;
    if (!groupRef.current) return;

    if (!reduced) {
      const c = controlsRef.current;
      if (c.isDragging) {
        groupRef.current.rotation.x += c.dragDelta.x;
        groupRef.current.rotation.y += c.dragDelta.y;
        c.dragDelta.x = 0;
        c.dragDelta.y = 0;
      } else {
        groupRef.current.rotation.x += c.angularVel.x;
        groupRef.current.rotation.y += c.angularVel.y;
      }
    }

    const scale = THREE.MathUtils.lerp(SCALE_MIN, SCALE_MAX, progress.get());
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      <points geometry={nodesGeometry} material={nodesMaterial} />
      <lineSegments geometry={connectionsGeometry} material={connectionsMaterial} />
    </group>
  );
}

export default function HeroNetwork({ progress }: { progress: MotionValue<number> }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);
  const [hoverCapable, setHoverCapable] = useState(false);
  const controlsRef = useRef<Controls>({
    isDragging: false,
    dragDelta: { x: 0, y: 0 },
    angularVel: { x: 0, y: DEFAULT_VEL_Y },
  });
  const lastPointerRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    setHoverCapable(mq.matches);
    const handler = (e: MediaQueryListEvent) => setHoverCapable(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!hoverCapable) return;

    const onPointerDown = (e: PointerEvent) => {
      const node = wrapperRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }
      controlsRef.current.isDragging = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!controlsRef.current.isDragging || !lastPointerRef.current) return;
      const now = performance.now();
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      const dt = Math.max(1, now - lastPointerRef.current.time);
      const rotY = dx * DRAG_SENSITIVITY;
      const rotX = dy * DRAG_SENSITIVITY;
      controlsRef.current.dragDelta.x += rotX;
      controlsRef.current.dragDelta.y += rotY;
      // Per-frame velocity for the post-release throw (frames are ~16.67ms).
      const frameScale = 16.67 / dt;
      controlsRef.current.angularVel.x = THREE.MathUtils.clamp(rotX * frameScale, -MAX_VEL, MAX_VEL);
      controlsRef.current.angularVel.y = THREE.MathUtils.clamp(rotY * frameScale, -MAX_VEL, MAX_VEL);
      lastPointerRef.current = { x: e.clientX, y: e.clientY, time: now };
    };

    const onPointerUp = () => {
      controlsRef.current.isDragging = false;
      lastPointerRef.current = null;
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [hoverCapable]);

  return (
    <div
      ref={wrapperRef}
      className={
        hoverCapable
          ? 'absolute inset-0 cursor-grab active:cursor-grabbing'
          : 'pointer-events-none absolute inset-0'
      }
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 8, 28], fov: 65, near: 0.1, far: 1000 }}
        frameloop={inView ? 'always' : 'never'}
      >
        <Suspense fallback={null}>
          <fogExp2 attach="fog" args={[0x000000, 0.002]} />
          <Starfield />
          <Network controlsRef={controlsRef} progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
