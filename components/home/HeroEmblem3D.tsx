"use client";

import { useEffect, useRef, useState } from "react";

interface HeroEmblem3DProps {
  className?: string;
}

export default function HeroEmblem3D({ className = "" }: HeroEmblem3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Pause rendering when offscreen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Mouse parallax interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const tiltX = prefersReducedMotion ? 0 : isHovered ? -mousePos.y * 22 : 0;
  const tiltY = prefersReducedMotion ? 0 : isHovered ? mousePos.x * 26 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center select-none pointer-events-auto ${className}`}
      style={{ perspective: 1200 }}
      aria-hidden="true"
    >
      {/* Soft Studio Lighting Halo */}
      <div
        className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full pointer-events-none transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(circle, rgba(184, 154, 90, 0.12) 0%, rgba(243, 240, 232, 0.04) 40%, transparent 70%)",
          filter: "blur(32px)",
          transform: `translate3d(${mousePos.x * 20}px, ${mousePos.y * 20}px, -40px)`,
        }}
      />

      {/* 3D Floating Structure */}
      <div
        className={`relative w-48 h-48 sm:w-64 sm:h-64 transition-transform ${
          isHovered ? "duration-200 ease-out" : "duration-700 ease-out"
        } ${!prefersReducedMotion && isVisible ? "animate-emblem-float" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        }}
      >
        {/* Deep Shadow Layer */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: "translateZ(-30px) scale(0.92)",
            filter: "blur(18px)",
            opacity: 0.5,
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full text-black fill-current">
            <g transform="translate(100, 100)">
              <path d="M-95,0 Q-65,-4 -45,-12 Q-65,4 -95,0 Z" />
              <path d="M95,0 Q65,-4 45,-12 Q65,4 95,0 Z" />
              <path d="M -50,-20 C -65,-2 -65,30 -45,50 C -25,70 10,75 35,60 C 25,68 -5,72 -30,55 C -50,40 -52,15 -42,-10 Z" />
              <path d="M 45,-25 C 65,-5 65,30 45,50 C 35,60 15,68 0,65 C 20,62 45,45 45,20 C 45,-2 30,-20 10,-28 Z" />
              <path d="M-8,-85 L10,-85 C14,-75 14,-65 8,-50 L8,60 C12,70 16,80 6,90 L-10,90 C-4,80 0,70 0,60 L0,-50 C-6,-65 -6,-75 -8,-85 Z" />
              <path d="M-40,-5 C-10,-35 25,-25 50,-5 C25,-15 -10,-20 -30,5 Z" />
              <path d="M-25,10 C5,35 40,40 65,65 C40,50 10,40 -15,20 Z" />
            </g>
          </svg>
        </div>

        {/* Back Bevel Layer (Dark Graphite Rim) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-[#1a1a1a]"
          style={{
            transform: "translateZ(-8px)",
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full fill-current">
            <g transform="translate(100, 100)">
              <path d="M-95,0 Q-65,-4 -45,-12 Q-65,4 -95,0 Z" />
              <path d="M95,0 Q65,-4 45,-12 Q65,4 95,0 Z" />
              <path d="M -50,-20 C -65,-2 -65,30 -45,50 C -25,70 10,75 35,60 C 25,68 -5,72 -30,55 C -50,40 -52,15 -42,-10 Z" />
              <path d="M 45,-25 C 65,-5 65,30 45,50 C 35,60 15,68 0,65 C 20,62 45,45 45,20 C 45,-2 30,-20 10,-28 Z" />
              <path d="M-8,-85 L10,-85 C14,-75 14,-65 8,-50 L8,60 C12,70 16,80 6,90 L-10,90 C-4,80 0,70 0,60 L0,-50 C-6,-65 -6,-75 -8,-85 Z" />
              <path d="M-40,-5 C-10,-35 25,-25 50,-5 C25,-15 -10,-20 -30,5 Z" />
              <path d="M-25,10 C5,35 40,40 65,65 C40,50 10,40 -15,20 Z" />
            </g>
          </svg>
        </div>

        {/* Mid Bevel Layer (Subtle Gold Rim) */}
        <div
          className="absolute inset-0 flex items-center justify-center text-[#b89a5a]"
          style={{
            transform: "translateZ(4px)",
            opacity: 0.85,
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full fill-current">
            <g transform="translate(100, 100)">
              <path d="M-95,0 Q-65,-4 -45,-12 Q-65,4 -95,0 Z" />
              <path d="M95,0 Q65,-4 45,-12 Q65,4 95,0 Z" />
              <path d="M -50,-20 C -65,-2 -65,30 -45,50 C -25,70 10,75 35,60 C 25,68 -5,72 -30,55 C -50,40 -52,15 -42,-10 Z" />
              <path d="M 45,-25 C 65,-5 65,30 45,50 C 35,60 15,68 0,65 C 20,62 45,45 45,20 C 45,-2 30,-20 10,-28 Z" />
              <path d="M-8,-85 L10,-85 C14,-75 14,-65 8,-50 L8,60 C12,70 16,80 6,90 L-10,90 C-4,80 0,70 0,60 L0,-50 C-6,-65 -6,-75 -8,-85 Z" />
              <path d="M-40,-5 C-10,-35 25,-25 50,-5 C25,-15 -10,-20 -30,5 Z" />
              <path d="M-25,10 C5,35 40,40 65,65 C40,50 10,40 -15,20 Z" />
            </g>
          </svg>
        </div>

        {/* Front Face Layer (Brushed Metallic Ivory & Obsidian Gradient) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: "translateZ(14px)",
          }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <linearGradient id="emblemFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FAF9F6" />
                <stop offset="45%" stopColor="#E2DDD2" />
                <stop offset="75%" stopColor="#B89A5A" />
                <stop offset="100%" stopColor="#7A683E" />
              </linearGradient>
              <radialGradient id="specularGlint" cx="35%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g transform="translate(100, 100)">
              {/* Main vector with metallic gradient */}
              <path
                d="M-95,0 Q-65,-4 -45,-12 Q-65,4 -95,0 Z"
                fill="url(#emblemFrontGrad)"
              />
              <path
                d="M95,0 Q65,-4 45,-12 Q65,4 95,0 Z"
                fill="url(#emblemFrontGrad)"
              />
              <path
                d="M -50,-20 C -65,-2 -65,30 -45,50 C -25,70 10,75 35,60 C 25,68 -5,72 -30,55 C -50,40 -52,15 -42,-10 Z"
                fill="url(#emblemFrontGrad)"
              />
              <path
                d="M 45,-25 C 65,-5 65,30 45,50 C 35,60 15,68 0,65 C 20,62 45,45 45,20 C 45,-2 30,-20 10,-28 Z"
                fill="url(#emblemFrontGrad)"
              />
              <path
                d="M-8,-85 L10,-85 C14,-75 14,-65 8,-50 L8,60 C12,70 16,80 6,90 L-10,90 C-4,80 0,70 0,60 L0,-50 C-6,-65 -6,-75 -8,-85 Z"
                fill="url(#emblemFrontGrad)"
              />
              <path
                d="M-40,-5 C-10,-35 25,-25 50,-5 C25,-15 -10,-20 -30,5 Z"
                fill="url(#emblemFrontGrad)"
              />
              <path
                d="M-25,10 C5,35 40,40 65,65 C40,50 10,40 -15,20 Z"
                fill="url(#emblemFrontGrad)"
              />

              {/* Specular Studio Highlight Overlay */}
              <circle cx="-15" cy="-25" r="45" fill="url(#specularGlint)" pointerEvents="none" />
            </g>
          </svg>
        </div>

        {/* Ambient Ring Glow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: "1px solid rgba(184, 154, 90, 0.18)",
            transform: "translateZ(8px) scale(1.15)",
          }}
        />
      </div>
    </div>
  );
}
