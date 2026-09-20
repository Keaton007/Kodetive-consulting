"use client";
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { MotionValue } from 'framer-motion';
import { useSiteReducedMotion } from '@/components/interactions/useSiteReducedMotion';

const SCALE_MIN = 0.5;
const SCALE_MAX = 1.5;

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

function isConnected(a: NodeRec, b: NodeRec) {
  return a.connections.some((c) => c.node === b);
}

function connect(a: NodeRec, b: NodeRec, strength: number) {
  if (isConnected(a, b)) return;
  a.connections.push({ node: b, strength });
  b.connections.push({ node: a, strength });
}

function generateCrystallineSphere(): NodeRec[] {
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

  const layers = 4;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let layer = 1; layer <= layers; layer++) {
    const radius = layer * 4;
    const numPoints = layer * 6;
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
        prev.sort((a, b) => pos.distanceTo(a.pos) - pos.distanceTo(b.pos));
        for (let j = 0; j < Math.min(2, prev.length); j++) {
          const d = pos.distanceTo(prev[j].pos);
          const strength = Math.max(0.3, 1 - d / (radius * 2));
          connect(node, prev[j], strength);
        }
      } else {
        connect(node, root, 0.9);
      }
    }
  }
  return nodes;
}

function Network({ progress }: { progress: MotionValue<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const reduced = useSiteReducedMotion();

  const network = useMemo(() => generateCrystallineSphere(), []);

  const { nodesGeometry, nodesMaterial } = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(network.length * 3);
    const sizes = new Float32Array(network.length);
    const colors = new Float32Array(network.length * 3);
    network.forEach((n, i) => {
      positions[i * 3 + 0] = n.pos.x;
      positions[i * 3 + 1] = n.pos.y;
      positions[i * 3 + 2] = n.pos.z;
      sizes[i] = n.size;
      const c = PALETTE[Math.min(n.level, PALETTE.length - 1)].clone();
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('nodeSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('nodeColor', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float nodeSize;
        attribute vec3 nodeColor;
        uniform float uTime;
        varying vec3 vColor;
        void main() {
          vColor = nodeColor;
          float breathe = sin(uTime * 0.7 + position.x * 0.15) * 0.15 + 0.85;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = nodeSize * breathe * 0.6 * (1000.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 c = 2.0 * gl_PointCoord - 1.0;
          float d = length(c);
          if (d > 1.0) discard;
          float gs = 1.0 - smoothstep(0.0, 0.5, d);
          gl_FragColor = vec4(vColor + vec3(1.0) * smoothstep(0.4, 0.0, d) * 0.3, gs * 0.95);
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
    const colors: number[] = [];
    const seen = new Set<string>();
    network.forEach((n, ni) => {
      n.connections.forEach((conn) => {
        const ci = network.indexOf(conn.node);
        if (ci < 0) return;
        const key = ni < ci ? `${ni}-${ci}` : `${ci}-${ni}`;
        if (seen.has(key)) return;
        seen.add(key);
        positions.push(n.pos.x, n.pos.y, n.pos.z, conn.node.pos.x, conn.node.pos.y, conn.node.pos.z);
        const lvl = Math.min(Math.floor((n.level + conn.node.level) / 2), PALETTE.length - 1);
        const c = PALETTE[lvl];
        colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
      });
    });
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
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
    nodesMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    if (!groupRef.current) return;
    if (!reduced) {
      groupRef.current.rotation.y += 0.001;
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

export default function HeroNetworkMobile({ progress }: { progress: MotionValue<number> }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);

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

  return (
    <div
      ref={wrapperRef}
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.25]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 6, 30], fov: 65, near: 0.1, far: 1000 }}
        frameloop={inView ? 'always' : 'never'}
      >
        <Suspense fallback={null}>
          <Network progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
