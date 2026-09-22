"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { RotateCw, Play, Pause, RefreshCw, Layers } from "lucide-react";

interface Interactive360ViewerProps {
  images: string[];
  productName: string;
  className?: string;
}

export default function Interactive360Viewer({
  images,
  productName,
  className = "",
}: Interactive360ViewerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number>(0);
  const startFrameRef = useRef<number>(0);
  const totalFrames = images.length;

  const nextFrame = useCallback(() => {
    setCurrentFrame((prev) => (prev + 1) % totalFrames);
  }, [totalFrames]);

  const prevFrame = useCallback(() => {
    setCurrentFrame((prev) => (prev - 1 + totalFrames) % totalFrames);
  }, [totalFrames]);

  // Auto spin loop
  useEffect(() => {
    if (!isPlaying || totalFrames <= 1) return;
    const interval = setInterval(nextFrame, 120);
    return () => clearInterval(interval);
  }, [isPlaying, totalFrames, nextFrame]);

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsPlaying(false);
    startXRef.current = e.clientX;
    startFrameRef.current = currentFrame;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || totalFrames <= 1) return;
      const deltaX = e.clientX - startXRef.current;
      const sensitivity = 18; // pixels per frame shift
      const frameShift = Math.floor(deltaX / sensitivity);
      const newFrame = (startFrameRef.current - frameShift + totalFrames * 100) % totalFrames;
      setCurrentFrame(newFrame);
    },
    [isDragging, totalFrames]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setIsPlaying(false);
    startXRef.current = e.touches[0].clientX;
    startFrameRef.current = currentFrame;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || totalFrames <= 1 || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    const sensitivity = 16;
    const frameShift = Math.floor(deltaX / sensitivity);
    const newFrame = (startFrameRef.current - frameShift + totalFrames * 100) % totalFrames;
    setCurrentFrame(newFrame);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevFrame();
      if (e.key === "ArrowRight") nextFrame();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextFrame, prevFrame]);

  if (!images || images.length === 0) return null;

  return (
    <div
      className={`relative w-full aspect-[3/4] bg-[#0d0d0d] rounded-sm overflow-hidden select-none cursor-grab active:cursor-grabbing border border-white/10 ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label={`Interactive 360 degree view of ${productName}`}
      role="region"
    >
      {/* Current Photo Frame */}
      <Image
        src={images[currentFrame]}
        alt={`${productName} - 360 degree angle ${currentFrame + 1} of ${totalFrames}`}
        fill
        priority
        className="object-cover transition-opacity duration-75"
        sizes="(max-width: 768px) 100vw, 50vw"
      />

      {/* Top Badge */}
      <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
        <span className="px-3 py-1 bg-black/70 backdrop-blur-md border border-white/10 text-white text-[11px] font-semibold tracking-wider rounded-full flex items-center gap-1.5">
          <Layers size={13} className="text-[var(--color-odessi-gold)]" />
          360° SPIN INTERACTIVE
        </span>
      </div>

      {/* Frame Badge */}
      <div className="absolute top-4 right-4 px-2.5 py-1 bg-black/70 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium rounded-full pointer-events-none">
        {currentFrame + 1} / {totalFrames}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-black/80 backdrop-blur-md border border-white/15 rounded-full text-white z-10 shadow-2xl pointer-events-auto">
        {/* Rotate Hint */}
        <div className="px-3 py-1 text-[11px] text-[var(--color-odessi-silver)] flex items-center gap-1 border-r border-white/10 hidden sm:flex">
          <RotateCw size={13} />
          <span>DRAG HORIZONTALLY TO SPIN</span>
        </div>

        {/* Auto Play Toggle */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-[var(--color-odessi-gold)] text-black font-medium' : 'hover:bg-white/15'}`}
          title={isPlaying ? "Pause Spin (Space)" : "Auto Spin (Space)"}
          aria-label={isPlaying ? "Pause spin" : "Start spin"}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>

        {/* Reset to Frame 0 */}
        <button
          onClick={() => {
            setCurrentFrame(0);
            setIsPlaying(false);
          }}
          className="p-2 hover:bg-white/15 rounded-full transition-colors"
          title="Reset to Front Angle"
          aria-label="Reset to front angle"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}
