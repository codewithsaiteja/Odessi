"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, X, Maximize2, Layers, Image as ImageIcon } from "lucide-react";
import type { Product3DAsset, Product360Sequence } from "@/types";

const Interactive360Viewer = dynamic(() => import("@/components/product/Interactive360Viewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[3/4] bg-[#0d0d0d] flex items-center justify-center text-white text-sm">
      <div className="flex items-center gap-2">
        <Layers size={18} className="animate-spin text-[var(--color-odessi-gold)]" />
        <span>Loading 360 Spin...</span>
      </div>
    </div>
  ),
});

interface ProductGalleryProps {
  images: string[];
  productName: string;
  className?: string;
  selectedColorHex?: string;
  model3D?: Product3DAsset;
  images360?: Product360Sequence;
}

export default function ProductGallery({ 
  images, 
  productName, 
  className = "",
  images360,
}: ProductGalleryProps) {
  const [viewMode, setViewMode] = useState<"2d" | "360">("2d");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const fallbackImage = "/placeholder-product.svg";

  const getImageSrc = (index: number) => {
    if (failedImages[index]) return fallbackImage;
    return images[index] || fallbackImage;
  };

  const handleImageError = (index: number) => {
    console.warn(`[ProductGallery] Image failed to load at index ${index}:`, images[index]);
    setFailedImages(prev => ({ ...prev, [index]: true }));
  };

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const goToImage = (index: number) => {
    setCurrentIndex(index);
    if (viewMode !== "2d") setViewMode("2d");
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "2d") return;
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") setIsFullscreen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, viewMode]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) goToNext();
    if (isRightSwipe) goToPrevious();
  };

  // Lock body scroll when fullscreen is open
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const hasSpin360 = Boolean(images360?.images && images360.images.length > 1);

  return (
    <>
      <div className={className}>
        {/* Experience Selector Tabs (Shown only if 360 Spin sequence exists) */}
        {hasSpin360 && (
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            {/* PHOTOS (2D) */}
            <button
              type="button"
              onClick={() => setViewMode("2d")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all ${
                viewMode === "2d"
                  ? "bg-[var(--color-odessi-black)] text-white shadow-sm"
                  : "bg-white border border-[var(--color-odessi-smoke)] text-[var(--color-odessi-stone)] hover:text-black"
              }`}
              aria-pressed={viewMode === "2d"}
              aria-label="View 2D photos gallery"
            >
              <ImageIcon size={13} />
              PHOTOS (2D)
            </button>

            {/* 360° WORN VIEW */}
            <button
              type="button"
              onClick={() => setViewMode("360")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all ${
                viewMode === "360"
                  ? "bg-[var(--color-odessi-black)] text-white shadow-sm"
                  : "bg-white border border-[var(--color-odessi-smoke)] text-[var(--color-odessi-stone)] hover:text-black"
              }`}
              aria-pressed={viewMode === "360"}
              aria-label="View 360 degree worn product experience"
            >
              <Layers size={13} className="text-[var(--color-odessi-gold)]" />
              360° WORN VIEW
            </button>
          </div>
        )}

        {/* Display Area */}
        <div className="relative">
          {viewMode === "360" ? (
            hasSpin360 ? (
              <Interactive360Viewer
                images={images360!.images}
                productName={productName}
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-[#0d0d0d] rounded-sm flex flex-col items-center justify-center p-6 text-center text-white">
                <p className="text-sm font-semibold mb-2">360° View Unavailable</p>
                <p className="text-xs text-slate-400 mb-4">No 360° sequence frames attached to this piece.</p>
                <button
                  type="button"
                  onClick={() => setViewMode("2d")}
                  className="px-4 py-2 bg-white text-black text-xs font-semibold uppercase rounded-full hover:bg-slate-200 transition"
                >
                  Back to Photos
                </button>
              </div>
            )
          ) : (
            <div 
              className="relative aspect-[3/4] bg-[var(--color-odessi-smoke)] rounded-sm overflow-hidden group cursor-pointer"
              onClick={() => setIsFullscreen(true)}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <Image
                src={getImageSrc(currentIndex)}
                alt={`${productName} - Image ${currentIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={currentIndex === 0}
                onError={() => handleImageError(currentIndex)}
              />

              {/* Fullscreen Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullscreen(true);
                }}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
                aria-label="View fullscreen"
              >
                <Maximize2 size={16} strokeWidth={1.5} />
              </button>

              {/* Navigation Arrows - Desktop */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevious();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white hidden md:flex"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} strokeWidth={1.5} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white hidden md:flex"
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} strokeWidth={1.5} />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-xs rounded-full">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="mt-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`
                    relative flex-shrink-0 w-16 h-20 rounded-sm overflow-hidden border-2 transition-all
                    ${index === currentIndex 
                      ? 'border-[var(--color-odessi-black)]' 
                      : 'border-transparent hover:border-[var(--color-odessi-stone)]'
                    }
                  `}
                  aria-label={`View image ${index + 1}`}
                  aria-current={index === currentIndex}
                >
                  <Image
                    src={getImageSrc(index)}
                    alt={`${productName} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    onError={() => handleImageError(index)}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            aria-label="Close fullscreen"
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={28} strokeWidth={1.5} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight size={28} strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 text-white text-sm rounded-full z-10">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Main Fullscreen Image */}
          <div 
            className="relative w-full h-full flex items-center justify-center px-4 py-16"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative w-full h-full max-w-5xl max-h-full">
              <Image
                src={images[currentIndex]}
                alt={`${productName} - Image ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
              <div className="flex gap-2 px-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToImage(index);
                    }}
                    className={`
                      relative flex-shrink-0 w-12 h-16 rounded-sm overflow-hidden border-2 transition-all
                      ${index === currentIndex 
                        ? 'border-white' 
                        : 'border-transparent hover:border-white/50'
                      }
                    `}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={image}
                      alt={`${productName} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}