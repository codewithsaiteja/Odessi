"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { RotateCw, Play, Pause, RefreshCw, Layers } from "lucide-react";

export interface Interactive360ViewerProps {
  images: string[];
  productName: string;
  className?: string;
  autoRotateInterval?: number;
}

export function Interactive360Viewer({
  images,
  productName,
  className = "",
  autoRotateInterval = 100,
}: Interactive360ViewerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const startXRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const startFrameRef = useRef<number>(0);
  const preloadedImagesRef = useRef<HTMLImageElement[]>([]);

  const totalFrames = images ? images.length : 0;

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Frame Preloader Pool (Priority Strategy: Front frame -> Adjacent -> Surrounding -> Remaining)
  useEffect(() => {
    if (!images || images.length === 0) return;

    let isMounted = true;
    setLoadedCount(1); // Frame 0 initially displayed via Next/Image

    const cache: HTMLImageElement[] = [];

    // Create spiral index sequence around frame 0: 0, N-1, 1, N-2, 2, N-3...
    const n = images.length;
    const loadIndices: number[] = [0];
    let left = n - 1;
    let right = 1;

    while (loadIndices.length < n) {
      if (right < n && !loadIndices.includes(right)) loadIndices.push(right);
      if (left > 0 && !loadIndices.includes(left)) loadIndices.push(left);
      right++;
      left--;
    }

    let count = 0;
    loadIndices.forEach((index) => {
      const img = new window.Image();
      img.src = images[index];
      img.onload = () => {
        if (!isMounted) return;
        count++;
        setLoadedCount(count);
      };
      img.onerror = () => {
        if (!isMounted) return;
        count++;
        setLoadedCount(count);
      };
      cache[index] = img;
    });

    preloadedImagesRef.current = cache;

    return () => {
      isMounted = false;
    };
  }, [images]);

  const nextFrame = useCallback(() => {
    if (totalFrames <= 1) return;
    setCurrentFrame((prev) => (prev + 1) % totalFrames);
  }, [totalFrames]);

  const prevFrame = useCallback(() => {
    if (totalFrames <= 1) return;
    setCurrentFrame((prev) => (prev - 1 + totalFrames) % totalFrames);
  }, [totalFrames]);

  // Auto spin loop (Respects prefers-reduced-motion)
  useEffect(() => {
    if (!isPlaying || totalFrames <= 1 || prefersReducedMotion) return;
    const interval = setInterval(nextFrame, autoRotateInterval);
    return () => clearInterval(interval);
  }, [isPlaying, totalFrames, autoRotateInterval, nextFrame, prefersReducedMotion]);

  // Physics momentum inertia loop
  const stopInertia = useCallback(() => {
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  }, []);

  // Ensure animation frame is cancelled on unmount
  useEffect(() => {
    return () => {
      stopInertia();
    };
  }, [stopInertia]);

  const startInertia = useCallback(() => {
    if (prefersReducedMotion || Math.abs(velocityRef.current) < 0.1) return;

    let currentVel = velocityRef.current;
    let accumulatedDelta = 0;
    const friction = 0.92;

    const step = () => {
      currentVel *= friction;
      if (Math.abs(currentVel) < 0.02) {
        stopInertia();
        return;
      }
      accumulatedDelta += currentVel * 16;
      const sensitivity = 16;
      const frameShift = Math.floor(accumulatedDelta / sensitivity);

      if (frameShift !== 0) {
        setCurrentFrame((prev) => (prev - frameShift + totalFrames * 1000) % totalFrames);
        accumulatedDelta %= sensitivity;
      }
      animFrameIdRef.current = requestAnimationFrame(step);
    };

    animFrameIdRef.current = requestAnimationFrame(step);
  }, [prefersReducedMotion, totalFrames, stopInertia]);

  // Mouse Drag / Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (totalFrames <= 1) return;
    stopInertia();
    setIsDragging(true);
    setIsPlaying(false);
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    lastTimestampRef.current = performance.now();
    velocityRef.current = 0;
    startFrameRef.current = currentFrame;

    // Capture pointer if available
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // Fallback for browsers not supporting pointer capture
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || totalFrames <= 1) return;
    const now = performance.now();
    const dt = now - lastTimestampRef.current || 16;
    const dx = e.clientX - lastXRef.current;

    velocityRef.current = dx / dt;
    lastXRef.current = e.clientX;
    lastTimestampRef.current = now;

    const deltaX = e.clientX - startXRef.current;
    const sensitivity = 16;
    const frameShift = Math.floor(deltaX / sensitivity);
    const newFrame = (startFrameRef.current - frameShift + totalFrames * 1000) % totalFrames;
    setCurrentFrame(newFrame);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Fallback
      }
      startInertia();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      velocityRef.current = 0;
      stopInertia();
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // Fallback
      }
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (totalFrames <= 1) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevFrame();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextFrame();
    } else if (e.key === " ") {
      e.preventDefault();
      if (!prefersReducedMotion) setIsPlaying((prev) => !prev);
    } else if (e.key === "Home") {
      e.preventDefault();
      stopInertia();
      setCurrentFrame(0);
      setIsPlaying(false);
    }
  };

  if (!images || images.length === 0) return null;

  const isFullyLoaded = loadedCount >= totalFrames;
  const loadPercentage = Math.round((loadedCount / totalFrames) * 100);

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onDragStart={(e) => e.preventDefault()}
      style={{ touchAction: "pan-y" }}
      className={`relative w-full aspect-[3/4] bg-[#0A0A0A] rounded-sm overflow-hidden select-none cursor-grab active:cursor-grabbing border border-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-odessi-gold)] ${className}`}
      aria-label={`360 degree product viewer for ${productName}. Use Left and Right arrow keys to rotate manually, Space to toggle auto-spin, and Home to return to the front.`}
      role="region"
    >
      {/* Photo Frame Rendering */}
      <Image
        src={images[currentFrame] || images[0]}
        alt={`${productName} - 360 degree view angle ${currentFrame + 1} of ${totalFrames}`}
        fill
        priority
        className="object-cover transition-opacity duration-75 pointer-events-none select-none"
        sizes="(max-width: 768px) 100vw, 50vw"
        draggable={false}
      />

      {/* Top Header Glass Badge */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-black/75 backdrop-blur-md border border-white/15 text-white text-[11px] font-semibold tracking-wider uppercase rounded-full flex items-center gap-1.5 shadow-lg">
            <Layers size={13} className="text-[#B89A5A]" />
            <span>360° WORN FIT</span>
          </span>
          {prefersReducedMotion && (
            <span className="px-2.5 py-1 bg-neutral-900/80 backdrop-blur-md border border-white/10 text-neutral-300 text-[10px] font-medium rounded-full">
              REDUCED MOTION
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isFullyLoaded && (
            <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md border border-white/15 text-amber-300 text-[10px] font-mono rounded-full">
              PRELOADING {loadPercentage}%
            </span>
          )}
          <span className="px-3 py-1 bg-black/75 backdrop-blur-md border border-white/15 text-white text-[11px] font-mono font-medium rounded-full shadow-lg">
            {String(currentFrame + 1).padStart(2, "0")} / {String(totalFrames).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Subtle Top Loading Line Bar */}
      {!isFullyLoaded && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-black/50 z-20">
          <div
            className="h-full bg-[#B89A5A] transition-all duration-300"
            style={{ width: `${loadPercentage}%` }}
          />
        </div>
      )}

      {/* Bottom Luxury Floating Control Pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-black/85 backdrop-blur-md border border-white/20 rounded-full text-white z-10 shadow-2xl pointer-events-auto">
        {/* Rotation Hint */}
        <div className="px-3 py-1 text-[11px] text-neutral-300 font-medium flex items-center gap-1.5 border-r border-white/15 hidden sm:flex">
          <RotateCw size={13} className="text-[#B89A5A]" />
          <span className="tracking-wider uppercase text-[10px]">DRAG TO ROTATE</span>
        </div>

        {/* Auto Spin Toggle (hidden if reduced motion preferred) */}
        {!prefersReducedMotion && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className={`p-2 rounded-full transition-all ${
              isPlaying
                ? "bg-[#B89A5A] text-black font-semibold shadow-md"
                : "hover:bg-white/15 text-white"
            }`}
            title={isPlaying ? "Pause Spin (Space)" : "Auto Spin (Space)"}
            aria-label={isPlaying ? "Pause automatic 360 spin" : "Start automatic 360 spin"}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>
        )}

        {/* Reset to Front Angle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            stopInertia();
            setCurrentFrame(0);
            setIsPlaying(false);
          }}
          className="p-2 hover:bg-white/15 rounded-full text-white transition-colors"
          title="Reset to Front Angle (Frame 01)"
          aria-label="Reset to front angle"
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </div>
  );
}

// Export both names for maximum compatibility
export const Product360Viewer = Interactive360Viewer;
export default Interactive360Viewer;
