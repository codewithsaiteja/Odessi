"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

export default function SizeGuide({ isOpen, onClose, category = "tees" }: SizeGuideProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Size data (placeholder - should be actual measurements from Odessi.tfi)
  const sizeData = {
    tees: [
      { size: "XS", chest: "36", length: "26", shoulder: "16", sleeve: "7" },
      { size: "S", chest: "38", length: "27", shoulder: "17", sleeve: "7.5" },
      { size: "M", chest: "40", length: "28", shoulder: "18", sleeve: "8" },
      { size: "L", chest: "42", length: "29", shoulder: "19", sleeve: "8.5" },
      { size: "XL", chest: "44", length: "30", shoulder: "20", sleeve: "9" },
      { size: "XXL", chest: "46", length: "31", shoulder: "21", sleeve: "9.5" },
    ],
    hoodies: [
      { size: "S", chest: "40", length: "26", shoulder: "18", sleeve: "24" },
      { size: "M", chest: "42", length: "27", shoulder: "19", sleeve: "25" },
      { size: "L", chest: "44", length: "28", shoulder: "20", sleeve: "26" },
      { size: "XL", chest: "46", length: "29", shoulder: "21", sleeve: "27" },
      { size: "XXL", chest: "48", length: "30", shoulder: "22", sleeve: "28" },
    ],
  };

  const currentSizeData = category === "hoodies" ? sizeData.hoodies : sizeData.tees;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
      >
        <div
          className="relative w-full max-w-3xl bg-white rounded-sm shadow-2xl pointer-events-auto max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-odessi-smoke)]">
            <h2 id="size-guide-title" className="type-h3 text-[var(--color-odessi-black)]">
              Size Guide
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 hover:opacity-60 transition-opacity"
              aria-label="Close size guide"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 space-y-6">
            {/* Notice */}
            <div className="p-4 bg-[var(--color-odessi-smoke)] rounded-sm">
              <p className="text-sm text-[var(--color-odessi-stone)]">
                ⚠️ <strong>Note:</strong> These are sample measurements. Please refer to actual Odessi.tfi 
                product measurements for accurate sizing information.
              </p>
            </div>

            {/* Size Chart */}
            <div>
              <h3 className="type-caption font-semibold text-[var(--color-odessi-black)] mb-3">
                Measurements (in inches)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-[var(--color-odessi-black)]">
                      <th className="text-left py-3 px-2 font-semibold text-[var(--color-odessi-black)]">
                        Size
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-[var(--color-odessi-black)]">
                        Chest
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-[var(--color-odessi-black)]">
                        Length
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-[var(--color-odessi-black)]">
                        Shoulder
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-[var(--color-odessi-black)]">
                        Sleeve
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSizeData.map((row, index) => (
                      <tr
                        key={row.size}
                        className={index % 2 === 0 ? "bg-[var(--color-odessi-smoke)]" : ""}
                      >
                        <td className="py-3 px-2 font-semibold text-[var(--color-odessi-black)]">
                          {row.size}
                        </td>
                        <td className="py-3 px-2 text-[var(--color-odessi-stone)]">{row.chest}"</td>
                        <td className="py-3 px-2 text-[var(--color-odessi-stone)]">{row.length}"</td>
                        <td className="py-3 px-2 text-[var(--color-odessi-stone)]">{row.shoulder}"</td>
                        <td className="py-3 px-2 text-[var(--color-odessi-stone)]">{row.sleeve}"</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How to Measure */}
            <div>
              <h3 className="type-caption font-semibold text-[var(--color-odessi-black)] mb-3">
                How to Measure
              </h3>
              <div className="space-y-3 text-sm text-[var(--color-odessi-stone)]">
                <div className="flex gap-3">
                  <span className="font-semibold text-[var(--color-odessi-black)] min-w-[80px]">Chest:</span>
                  <span>Measure around the fullest part of your chest, keeping the tape horizontal.</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-[var(--color-odessi-black)] min-w-[80px]">Length:</span>
                  <span>Measure from the highest point of the shoulder to the bottom hem.</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-[var(--color-odessi-black)] min-w-[80px]">Shoulder:</span>
                  <span>Measure from one shoulder seam to the other across the back.</span>
                </div>
                <div className="flex gap-3">
                  <span className="font-semibold text-[var(--color-odessi-black)] min-w-[80px]">Sleeve:</span>
                  <span>Measure from the shoulder seam to the end of the sleeve.</span>
                </div>
              </div>
            </div>

            {/* Fit Guide */}
            <div>
              <h3 className="type-caption font-semibold text-[var(--color-odessi-black)] mb-3">
                Fit Guide
              </h3>
              <div className="space-y-2 text-sm text-[var(--color-odessi-stone)]">
                <p><strong className="text-[var(--color-odessi-black)]">Regular Fit:</strong> True to size with comfortable room for movement.</p>
                <p><strong className="text-[var(--color-odessi-black)]">Oversized Fit:</strong> Intentionally loose and boxy. Consider sizing down for a more fitted look.</p>
                <p><strong className="text-[var(--color-odessi-black)]">Drop-shoulder:</strong> Relaxed shoulder seams sit lower on the arm.</p>
              </div>
            </div>

            {/* Care Info */}
            <div className="p-4 border border-[var(--color-odessi-smoke)] rounded-sm">
              <h4 className="font-semibold text-[var(--color-odessi-black)] mb-2 text-sm">
                Still unsure about sizing?
              </h4>
              <p className="text-sm text-[var(--color-odessi-stone)] mb-3">
                Contact our customer service team for personalized sizing recommendations.
              </p>
              <a
                href="/contact"
                className="inline-block px-4 py-2 text-sm bg-[var(--color-odessi-black)] text-white rounded-sm hover:bg-[var(--color-odessi-stone)] transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}