"use client";

import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
import { RotateCw, ZoomIn, ZoomOut, RefreshCw, Box, AlertCircle, Play, Pause } from "lucide-react";
import Image from "next/image";

interface Product3DViewerProps {
  modelUrl?: string;
  posterUrl?: string;
  colorHex?: string;
  productName: string;
  autoRotateDefault?: boolean;
  className?: string;
  onFallbackToPhotos?: () => void;
}

// ── GLB/GLTF Model Component with Color Sync ──
function GLTFModel({ modelUrl, colorHex }: { modelUrl: string; colorHex?: string }) {
  const { scene } = useGLTF(modelUrl);
  const copiedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    if (colorHex && copiedScene) {
      copiedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial;
            if (mat && mat.color) {
              mat.color.setStyle(colorHex);
              mat.needsUpdate = true;
            }
          }
        }
      });
    }
  }, [copiedScene, colorHex]);

  return <primitive object={copiedScene} scale={1.5} />;
}

// ── Procedural Garment Mesh (High-Fidelity 3D Apparel Silhouette) ──
function ProceduralGarmentMesh({ colorHex }: { colorHex?: string }) {
  const meshRef = useRef<THREE.Group>(null);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex || "#1a1a1a"),
      roughness: 0.7,
      metalness: 0.05,
      bumpScale: 0.02,
      side: THREE.DoubleSide,
    });
  }, [colorHex]);

  // Subtle breathing animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.04;
    }
  });

  return (
    <group ref={meshRef} position={[0, -0.2, 0]}>
      {/* Torso */}
      <mesh material={material} position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.05, 2.2, 32, 16]} />
      </mesh>
      
      {/* Left Sleeve */}
      <mesh material={material} position={[-1.15, 0.5, 0]} rotation={[0, 0, 0.35]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.38, 1.1, 24]} />
      </mesh>

      {/* Right Sleeve */}
      <mesh material={material} position={[1.15, 0.5, 0]} rotation={[0, 0, -0.35]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.38, 1.1, 24]} />
      </mesh>

      {/* Collar Ring */}
      <mesh material={material} position={[0, 1.12, 0]} castShadow receiveShadow>
        <torusGeometry args={[0.42, 0.08, 16, 32]} />
      </mesh>

      {/* Front Chest Crest Badge */}
      <mesh position={[0, 0.45, 0.92]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.35, 0.35]} />
        <meshStandardMaterial color="#F3F0E8" roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
}

export default function Product3DViewer({
  modelUrl,
  posterUrl,
  colorHex = "#1a1a1a",
  productName,
  autoRotateDefault = true,
  className = "",
  onFallbackToPhotos,
}: Product3DViewerProps) {
  const [autoRotate, setAutoRotate] = useState(autoRotateDefault);
  const [zoomLevel, setZoomLevel] = useState(3.8);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // OrbitControls ref to reset camera position
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    setZoomLevel(3.8);
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.max(prev - 0.6, 2.0));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.min(prev + 0.6, 6.0));
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-" || e.key === "_") handleZoomOut();
      if (e.key === "r" || e.key === "R") resetCamera();
      if (e.key === " ") {
        e.preventDefault();
        setAutoRotate((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className={`relative w-full aspect-[3/4] bg-[#0d0d0d] rounded-sm overflow-hidden select-none border border-white/10 ${className}`}
      aria-label={`Interactive 3D model viewer for ${productName}`}
      role="region"
    >
      {/* Fallback image when error occurs */}
      {hasError && posterUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080808] z-20">
          <Image src={posterUrl} alt={productName} fill className="object-cover opacity-60" />
          <div className="relative z-10 flex flex-col items-center p-6 text-center space-y-3">
            <div className="px-3 py-1.5 bg-black/80 rounded-full text-xs text-amber-400 font-semibold flex items-center gap-2">
              <AlertCircle size={14} />
              3D VIEW UNAVAILABLE
            </div>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Could not render the WebGL 3D asset. Displaying static preview.
            </p>
            {onFallbackToPhotos && (
              <button
                type="button"
                onClick={onFallbackToPhotos}
                className="px-4 py-2 bg-white text-black text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-slate-200 transition"
              >
                BACK TO PHOTOS
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      {!hasError && (
        <Canvas
          camera={{ position: [0, 0, zoomLevel], fov: 45 }}
          onCreated={() => setIsLoading(false)}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onError={() => setHasError(true)}
        >
          {/* Lighting setup */}
          <ambientLight intensity={0.7} color="#FAF9F6" />
          <directionalLight position={[4, 6, 5]} intensity={1.6} color="#FAF9F6" castShadow />
          <directionalLight position={[-5, -3, -4]} intensity={0.6} color="#B89A5A" />
          <pointLight position={[0, 2, 3]} intensity={0.4} color="#FFFFFF" />

          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={1.8}
            maxDistance={6.5}
            autoRotate={autoRotate}
            autoRotateSpeed={1.8}
            rotateSpeed={0.8}
          />

          {/* Model Content */}
          <Center>
            <Suspense fallback={null}>
              {modelUrl ? (
                <GLTFModel modelUrl={modelUrl} colorHex={colorHex} />
              ) : (
                <ProceduralGarmentMesh colorHex={colorHex} />
              )}
            </Suspense>
          </Center>
        </Canvas>
      )}

      {/* Top Badge Overlay */}
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
        <span className="px-3 py-1 bg-black/70 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold tracking-wider rounded-full flex items-center gap-1.5">
          <Box size={13} className="text-[var(--color-odessi-gold)]" />
          3D MODEL INTERACTIVE
        </span>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-black/80 backdrop-blur-md border border-white/15 rounded-full text-white z-10 shadow-2xl">
        {/* Rotate Hint */}
        <div className="px-3 py-1 text-[11px] text-[var(--color-odessi-silver)] flex items-center gap-1 border-r border-white/10 hidden sm:flex">
          <RotateCw size={13} />
          <span>DRAG TO ROTATE</span>
        </div>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-white/15 rounded-full transition-colors"
          title="Zoom In (+)"
          aria-label="Zoom in 3D model"
        >
          <ZoomIn size={16} />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-white/15 rounded-full transition-colors"
          title="Zoom Out (-)"
          aria-label="Zoom out 3D model"
        >
          <ZoomOut size={16} />
        </button>

        {/* Auto Rotate Toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-full transition-colors ${autoRotate ? 'bg-[var(--color-odessi-gold)] text-black font-medium' : 'hover:bg-white/15'}`}
          title={autoRotate ? "Pause Auto Rotation (Space)" : "Start Auto Rotation (Space)"}
          aria-label={autoRotate ? "Pause auto rotation" : "Start auto rotation"}
        >
          {autoRotate ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {/* Reset Camera */}
        <button
          onClick={resetCamera}
          className="p-2 hover:bg-white/15 rounded-full transition-colors"
          title="Reset View (R)"
          aria-label="Reset 3D view camera"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}
