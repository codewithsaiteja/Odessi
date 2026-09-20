"use client";

import { useState } from "react";
import { X, Ruler, AlertCircle } from "lucide-react";

interface SizeAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize?: (size: string) => void;
}

export function SizeAssistantModal({ isOpen, onClose, onSelectSize }: SizeAssistantModalProps) {
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [fitPreference, setFitPreference] = useState<"SLIM" | "REGULAR" | "OVERSIZED">("OVERSIZED");
  const [recommendation, setRecommendation] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculateSize = (e: React.FormEvent) => {
    e.preventDefault();

    // Pure client-side estimation calculation for Odessi's signature oversized streetwear fit
    let baseSize = "M";

    if (heightCm < 165) {
      baseSize = weightKg < 60 ? "S" : "M";
    } else if (heightCm <= 175) {
      if (weightKg < 65) baseSize = "S";
      else if (weightKg <= 75) baseSize = "M";
      else baseSize = "L";
    } else if (heightCm <= 185) {
      if (weightKg < 70) baseSize = "M";
      else if (weightKg <= 85) baseSize = "L";
      else baseSize = "XL";
    } else {
      if (weightKg < 80) baseSize = "L";
      else baseSize = "XL";
    }

    // Adjust for fit preference
    if (fitPreference === "SLIM") {
      if (baseSize === "XL") baseSize = "L";
      else if (baseSize === "L") baseSize = "M";
      else if (baseSize === "M") baseSize = "S";
    } else if (fitPreference === "OVERSIZED") {
      // Odessi is already oversized by default, but if user explicitly wants extreme drape:
      // keep baseSize as is for natural drop-shoulder fit
    }

    setRecommendation(baseSize);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xl animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[#B89A5A] text-xs font-semibold uppercase tracking-widest">
          <Ruler className="w-4 h-4" />
          Interactive Fit Guide
        </div>
        <h3 className="text-2xl font-serif font-bold uppercase tracking-tight text-[#0A0A0A] mb-1">
          FIND YOUR SIZE
        </h3>
        <p className="text-xs text-neutral-500 mb-6">
          Answer two quick questions to calculate your optimal Odessi.tfi fit.
        </p>

        {!recommendation ? (
          <form onSubmit={calculateSize} className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                <span>Height</span>
                <span className="font-mono text-[#B89A5A]">{heightCm} cm</span>
              </div>
              <input
                type="range"
                min={150}
                max={200}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full accent-[#0A0A0A]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                <span>Weight</span>
                <span className="font-mono text-[#B89A5A]">{weightKg} kg</span>
              </div>
              <input
                type="range"
                min={45}
                max={120}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full accent-[#0A0A0A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
                Preferred Fit Silhouette
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["SLIM", "REGULAR", "OVERSIZED"] as const).map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setFitPreference(pref)}
                    className={`py-2 px-3 text-xs font-semibold uppercase rounded-xl border transition-all ${
                      fitPreference === pref
                        ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#0A0A0A] hover:bg-[#171717] text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
            >
              CALCULATE FIT RECOMMENDATION →
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-6">
            <div className="p-6 bg-[#F7F5F0] rounded-2xl border border-neutral-200">
              <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1">
                RECOMMENDED SIZE
              </div>
              <div className="text-5xl font-serif font-bold text-[#0A0A0A] font-mono mb-2">
                {recommendation}
              </div>
              <p className="text-xs text-neutral-600 font-light max-w-xs mx-auto">
                Based on {heightCm}cm / {weightKg}kg with an {fitPreference.toLowerCase()} drape.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-[11px] text-amber-800 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Note: This is an <strong>approximate recommendation</strong>. All Odessi garments feature intentional drop-shoulder oversized fits.
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRecommendation(null)}
                className="flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-600 border border-neutral-300 rounded-xl hover:bg-neutral-50"
              >
                Recalculate
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSelectSize && recommendation) {
                    onSelectSize(recommendation);
                  }
                  onClose();
                }}
                className="flex-1 py-3 bg-[#0A0A0A] text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-neutral-800"
              >
                Apply Size
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
