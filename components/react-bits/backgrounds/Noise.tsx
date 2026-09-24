"use client";

import React, { useRef, useEffect } from "react";

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
  className?: string;
}

const Noise: React.FC<NoiseProps> = ({
  patternSize = 256,
  patternRefreshInterval = 3,
  patternAlpha = 6, // Subtle fashion editorial grain
  className = "",
}) => {
  const grainRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Respect reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = grainRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let animationId: number;

    const canvasSize = patternSize;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const drawGrain = () => {
      const imageData = ctx.createImageData(canvasSize, canvasSize);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = patternAlpha;
      }

      ctx.putImageData(imageData, 0, 0);
    };

    // Draw once initially
    drawGrain();

    if (prefersReduced) return;

    const loop = () => {
      if (frame % patternRefreshInterval === 0) {
        drawGrain();
      }
      frame++;
      animationId = window.requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.cancelAnimationFrame(animationId);
    };
  }, [patternSize, patternRefreshInterval, patternAlpha]);

  return (
    <canvas
      className={`pointer-events-none absolute inset-0 h-full w-full opacity-40 mix-blend-overlay ${className}`}
      ref={grainRef}
      style={{
        imageRendering: "pixelated",
      }}
      aria-hidden="true"
    />
  );
};

export default Noise;
