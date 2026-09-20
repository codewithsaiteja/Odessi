"use client";

import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import Hero3DEmblem from "./Hero3DEmblem";
import Image from "next/image";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("3D Canvas fallback activated:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface Hero3DCanvasProps {
  className?: string;
}

export default function Hero3DCanvas({ className = "" }: Hero3DCanvasProps) {
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }

    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleMotionChange);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || isMobile || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setPointerPos({ x, y });
  };

  const StaticFallback = (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-[#080808]/40 backdrop-blur-xs rounded-full">
      <Image
        src="/logo-mark.svg"
        alt="Odessi Emblem"
        width={180}
        height={180}
        priority
        className="opacity-80 filter brightness-125 drop-shadow-[0_0_25px_rgba(243,240,232,0.2)] animate-pulse"
      />
    </div>
  );

  if (!webglSupported) {
    return StaticFallback;
  }

  return (
    <CanvasErrorBoundary fallback={StaticFallback}>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={`relative w-full h-full min-h-[300px] sm:min-h-[400px] select-none ${className}`}
        aria-label="3D Odessi Emblem interactive brand experience"
        role="img"
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onError={() => setWebglSupported(false)}
        >
          {/* Studio Lighting Setup */}
          <ambientLight intensity={0.6} color="#171717" />
          <directionalLight position={[5, 8, 5]} intensity={1.8} color="#FAF9F6" />
          <directionalLight position={[-6, -4, -3]} intensity={0.7} color="#B89A5A" />
          <pointLight position={[0, 0, 3]} intensity={0.5} color="#F3F0E8" />

          {/* 3D Official Odessi Emblem Mesh */}
          <Hero3DEmblem pointerPosition={pointerPos} reducedMotion={reducedMotion} />
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  );
}
