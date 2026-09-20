"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import * as THREE from "three";

const EMBLEM_SVG_STRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <g transform="translate(100, 100)">
    <path d="M-95,0 Q-65,-4 -45,-12 Q-65,4 -95,0 Z" />
    <path d="M95,0 Q65,-4 45,-12 Q65,4 95,0 Z" />
    <path d="M -50,-20 C -65,-2 -65,30 -45,50 C -25,70 10,75 35,60 C 25,68 -5,72 -30,55 C -50,40 -52,15 -42,-10 Z" />
    <path d="M 45,-25 C 65,-5 65,30 45,50 C 35,60 15,68 0,65 C 20,62 45,45 45,20 C 45,-2 30,-20 10,-28 Z" />
    <path d="M-8,-85 L10,-85 C14,-75 14,-65 8,-50 L8,60 C12,70 16,80 6,90 L-10,90 C-4,80 0,70 0,60 L0,-50 C-6,-65 -6,-75 -8,-85 Z" />
    <path d="M-40,-5 C-10,-35 25,-25 50,-5 C25,-15 -10,-20 -30,5 Z" />
    <path d="M-25,10 C5,35 40,40 65,65 C40,50 10,40 -15,20 Z" />
  </g>
</svg>`;

interface Hero3DEmblemProps {
  pointerPosition?: { x: number; y: number };
  reducedMotion?: boolean;
}

export default function Hero3DEmblem({
  pointerPosition = { x: 0, y: 0 },
  reducedMotion = false,
}: Hero3DEmblemProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  // Parse SVG and create 3D geometries for each shape in the official Odessi emblem
  const geometries = useMemo(() => {
    const loader = new SVGLoader();
    const svgData = loader.parse(EMBLEM_SVG_STRING);
    
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 4,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 1,
      bevelThickness: 1,
    };

    return svgData.paths.flatMap((path) => {
      const shapes = (path as any).toShapes(true) as THREE.Shape[]; // eslint-disable-line @typescript-eslint/no-explicit-any

      return shapes.map((shape: THREE.Shape) => {

        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.center();
        // Flip SVG coordinate Y axis so top is up
        geo.scale(1, -1, 1);
        return geo;
      });
    });
  }, []);

  // Soft ivory satin material matching Odessi visual identity (#F3F0E8)
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#F3F0E8"),
        roughness: 0.3,
        metalness: 0.15,
        side: THREE.DoubleSide,
      }),
    []
  );

  // Smooth frame loop animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (reducedMotion) {
      // Keep static or extremely subtle breathing
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.x = 0;
      return;
    }

    // Slow cinematic continuous rotation (0.1 rad/s)
    groupRef.current.rotation.y += delta * 0.12;

    // Subtle pointer parallax dampening
    targetRotation.current.x = pointerPosition.y * 0.25;
    targetRotation.current.y = pointerPosition.x * 0.35;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotation.current.x,
      0.05
    );
  });

  return (
    <group ref={groupRef} scale={[0.022, 0.022, 0.022]} position={[0, 0, 0]}>
      {geometries.map((geo, index) => (
        <mesh key={index} geometry={geo} material={material} castShadow receiveShadow />
      ))}
    </group>
  );
}
