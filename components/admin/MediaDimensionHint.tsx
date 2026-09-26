import React from "react";
import { Info, Maximize2 } from "lucide-react";

export interface MediaDimensionHintProps {
  recommendedWidth: number;
  recommendedHeight: number;
  aspectRatio: string;
  allowedFormats?: string[];
  maxSizeMb?: number;
  className?: string;
}

export default function MediaDimensionHint({
  recommendedWidth,
  recommendedHeight,
  aspectRatio,
  allowedFormats = ["JPG", "PNG", "WEBP"],
  maxSizeMb = 10,
  className = "",
}: MediaDimensionHintProps) {
  return (
    <div
      className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 p-2 rounded-md bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 font-mono ${className}`}
    >
      <div className="flex items-center space-x-1.5 text-stone-700 font-semibold">
        <Maximize2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>
          {recommendedWidth} × {recommendedHeight} px
        </span>
        <span className="px-1.5 py-0.2 bg-stone-200/70 text-stone-800 rounded text-[10px]">
          {aspectRatio}
        </span>
      </div>

      <span className="hidden sm:inline text-stone-300">•</span>

      <div className="flex items-center space-x-1 text-stone-500">
        <span>Formats:</span>
        <span className="text-stone-700 font-medium">
          {allowedFormats.join(", ")}
        </span>
      </div>

      <span className="hidden sm:inline text-stone-300">•</span>

      <div className="flex items-center space-x-1 text-stone-500">
        <span>Max:</span>
        <span className="text-stone-700 font-medium">{maxSizeMb} MB</span>
      </div>
    </div>
  );
}
