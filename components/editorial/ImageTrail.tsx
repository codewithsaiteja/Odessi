"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

interface ImageTrailItem {
  id: number;
  x: number;
  y: number;
  imageSrc: string;
  rotation: number;
  scale: number;
}

interface ImageTrailProps {
  images: string[];
  children?: React.ReactNode;
  className?: string;
  maxTrailItems?: number;
  distanceThreshold?: number; // Minimum mouse travel (px) before spawning next image
}

export function ImageTrail({
  images,
  children,
  className = "",
  maxTrailItems = 5,
  distanceThreshold = 65,
}: ImageTrailProps) {
  const [trailItems, setTrailItems] = useState<ImageTrailItem[]>([]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const imageIndexRef = useRef<number>(0);
  const nextIdRef = useRef<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Cleanup all pending timers on unmount
  useEffect(() => {
    const activeTimers = timersRef.current;
    return () => {
      activeTimers.forEach((t) => clearTimeout(t));
      activeTimers.clear();
    };
  }, []);

  const spawnTrailItem = useCallback(
    (clientX: number, clientY: number) => {
      if (!images || images.length === 0 || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      // Pick next image sequentially from array
      const currentImage = images[imageIndexRef.current % images.length];
      imageIndexRef.current += 1;

      // Subtle random rotation (-10deg to +10deg) and scale
      const rotation = (Math.random() - 0.5) * 20;
      const scale = 0.85 + Math.random() * 0.25;

      const newItem: ImageTrailItem = {
        id: nextIdRef.current++,
        x: relativeX,
        y: relativeY,
        imageSrc: currentImage,
        rotation,
        scale,
      };

      setTrailItems((prev) => {
        const updated = [...prev, newItem];
        // Enforce maximum node pool
        if (updated.length > maxTrailItems) {
          return updated.slice(updated.length - maxTrailItems);
        }
        return updated;
      });

      // Auto prune item after transition duration
      const timerId = setTimeout(() => {
        timersRef.current.delete(timerId);
        setTrailItems((prev) => prev.filter((item) => item.id !== newItem.id));
      }, 700);

      timersRef.current.add(timerId);
    },
    [images, maxTrailItems]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Disable on touch-oriented devices (coarse pointer) or narrow viewports
    if (typeof window !== "undefined") {
      if (
        window.innerWidth < 1024 ||
        window.matchMedia("(hover: none)").matches ||
        window.matchMedia("(pointer: coarse)").matches
      ) {
        return;
      }
    }

    const { clientX, clientY } = e;

    if (!lastPosRef.current) {
      lastPosRef.current = { x: clientX, y: clientY };
      spawnTrailItem(clientX, clientY);
      return;
    }

    const dx = clientX - lastPosRef.current.x;
    const dy = clientY - lastPosRef.current.y;
    const distance = Math.hypot(dx, dy);

    if (distance >= distanceThreshold) {
      lastPosRef.current = { x: clientX, y: clientY };
      spawnTrailItem(clientX, clientY);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Floating Trail Elements */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {trailItems.map((item) => (
          <div
            key={item.id}
            className="absolute w-24 h-32 md:w-32 md:h-44 -translate-x-1/2 -translate-y-1/2 shadow-2xl rounded-sm overflow-hidden border border-white/20 transition-all duration-700 ease-out animate-trail-fade"
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
              transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
            }}
          >
            <Image
              src={item.imageSrc}
              alt="Odessi Editorial Trail"
              fill
              className="object-cover"
              sizes="128px"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}

export default ImageTrail;
