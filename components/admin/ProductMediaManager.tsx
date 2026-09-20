"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Trash2,
  Star,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  FileImage,
  Loader2,
} from "lucide-react";
import { getMediaUrl } from "@/lib/product-utils";

export interface StagedImage {
  id?: number;
  file?: File;
  previewUrl: string;
  altText: string;
  isPrimary: boolean;
  isUploaded?: boolean;
}

interface ProductMediaManagerProps {
  productId?: number | null;
  existingImages?: any[];
  stagedImages: StagedImage[];
  onStagedImagesChange: (images: StagedImage[]) => void;
  onUploadSingleImage?: (file: File, altText: string, isPrimary: boolean) => Promise<any>;
  onDeleteSingleImage?: (imageId: number) => Promise<void>;
  onSetPrimaryImage?: (imageId: number) => Promise<void>;
  onReorderImages?: (imageIds: number[]) => Promise<void>;
}

export default function ProductMediaManager({
  productId,
  stagedImages,
  onStagedImagesChange,
  onUploadSingleImage,
  onDeleteSingleImage,
  onSetPrimaryImage,
  onReorderImages,
}: ProductMediaManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "model/gltf-binary", "model/gltf+json", "application/octet-stream"];
    const allowedExts = [".jpeg", ".jpg", ".png", ".webp", ".glb", ".gltf"];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      
      if (!allowedTypes.includes(file.type.toLowerCase()) && !allowedExts.includes(ext)) {
        setError(`File "${file.name}" is not a valid format. Allowed: JPG, PNG, WEBP, GLB, GLTF.`);
        continue;
      }
      const is3DModel = ext === ".glb" || ext === ".gltf";
      const maxSize = is3DModel ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`File "${file.name}" exceeds the size limit (${is3DModel ? '50MB' : '10MB'}).`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    if (productId && onUploadSingleImage) {
      // Direct Upload for existing product
      setIsUploading(true);
      try {
        for (const file of validFiles) {
          const isPrimary = stagedImages.length === 0;
          await onUploadSingleImage(file, file.name.split(".")[0], isPrimary);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to upload image.");
      } finally {
        setIsUploading(false);
      }
    } else {
      // Staging mode for new product creation
      const newStaged: StagedImage[] = validFiles.map((file, idx) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        altText: file.name.split(".")[0],
        isPrimary: stagedImages.length === 0 && idx === 0,
        isUploaded: false,
      }));

      onStagedImagesChange([...stagedImages, ...newStaged]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemove = async (index: number) => {
    const target = stagedImages[index];
    if (productId && target.id && onDeleteSingleImage) {
      try {
        await onDeleteSingleImage(target.id);
      } catch (err: any) {
        setError(err?.message || "Failed to delete image.");
      }
    } else {
      const updated = stagedImages.filter((_, i) => i !== index);
      if (target.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      onStagedImagesChange(updated);
    }
  };

  const handleSetPrimary = async (index: number) => {
    const target = stagedImages[index];
    if (productId && target.id && onSetPrimaryImage) {
      try {
        await onSetPrimaryImage(target.id);
      } catch (err: any) {
        setError(err?.message || "Failed to set primary image.");
      }
    } else {
      const updated = stagedImages.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }));
      onStagedImagesChange(updated);
    }
  };

  const handleMove = async (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stagedImages.length) return;

    const updated = [...stagedImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onStagedImagesChange(updated);

    if (productId && onReorderImages) {
      const imageIds = updated.map((i) => i.id).filter(Boolean) as number[];
      if (imageIds.length === updated.length) {
        try {
          await onReorderImages(imageIds);
        } catch (err: any) {
          console.error("Reorder failed", err);
        }
      }
    }
  };

  const handleAltChange = (index: number, text: string) => {
    const updated = stagedImages.map((img, i) =>
      i === index ? { ...img, altText: text } : img
    );
    onStagedImagesChange(updated);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-2xs">
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <FileImage className="w-4 h-4 text-amber-500" />
            Product Media ({stagedImages.length})
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Upload high-resolution luxury product photography. The first image will be set as primary.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          <span>Upload Image</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
      />

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-amber-500 bg-amber-50/50 scale-[0.99]"
            : "border-slate-200 hover:border-slate-400 bg-slate-50/50"
        }`}
      >
        <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-xs font-semibold text-slate-700">
          Drag & drop images here, or <span className="text-amber-600 underline">browse</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          Supports JPG, PNG, WEBP (Max 5MB per file)
        </p>
      </div>

      {/* Image Gallery Grid */}
      {stagedImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
          {stagedImages.map((img, idx) => (
            <div
              key={img.id || idx}
              className={`relative border rounded-xl overflow-hidden bg-slate-900 group shadow-2xs flex flex-col justify-between ${
                img.isPrimary ? "ring-2 ring-amber-500 border-amber-500" : "border-slate-200"
              }`}
            >
              {/* Image Container */}
              <div className="relative aspect-square w-full bg-slate-950">
                <Image
                  src={getMediaUrl(img.previewUrl)}
                  alt={img.altText || `Product image ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                  onError={(e) => {
                    console.warn(`[ProductMediaManager] Image load error for ID ${img.id || idx}:`, img.previewUrl);
                  }}
                />

                {/* Primary Badge */}
                {img.isPrimary ? (
                  <span className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-slate-950" /> Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(idx)}
                    className="absolute top-2 left-2 bg-slate-950/80 hover:bg-amber-500 text-white hover:text-slate-950 text-[10px] uppercase font-semibold px-2 py-0.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition"
                  >
                    Set Primary
                  </button>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-red-600 text-slate-300 hover:text-white rounded-full backdrop-blur-sm transition"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Controls Footer */}
              <div className="p-2.5 bg-white border-t border-slate-100 space-y-2">
                {/* Alt Text Input */}
                <input
                  type="text"
                  value={img.altText}
                  onChange={(e) => handleAltChange(idx, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-800 focus:outline-none focus:border-slate-900"
                  placeholder="Alt description..."
                />

                {/* Reorder Arrows */}
                <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400 font-mono">
                  <span>#{idx + 1}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, "left")}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === stagedImages.length - 1}
                      onClick={() => handleMove(idx, "right")}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-30"
                      title="Move Right"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-xs font-mono text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
          No media added yet. Use the upload area above or drag & drop product images.
        </div>
      )}
    </div>
  );
}
