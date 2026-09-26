"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Link as LinkIcon,
  X,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { getMediaUrl } from "@/lib/product-utils";
import MediaDimensionHint from "./MediaDimensionHint";

export interface AdminMediaPickerProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  onUploadFile?: (file: File) => Promise<{ url: string } | string>;
  onDeleteImage?: () => Promise<void> | void;
  recommendedWidth: number;
  recommendedHeight: number;
  aspectRatio: string;
  allowedFormats?: string[];
  maxSizeMb?: number;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

export default function AdminMediaPicker({
  label,
  value,
  onChange,
  onUploadFile,
  onDeleteImage,
  recommendedWidth,
  recommendedHeight,
  aspectRatio,
  allowedFormats = ["JPG", "PNG", "WEBP"],
  maxSizeMb = 10,
  placeholder = "https://... or /api/media/...",
  disabled = false,
  helperText,
  className = "",
}: AdminMediaPickerProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState<string>(value || "");
  const [uploading, setUploading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal urlInput state when external value changes
  useEffect(() => {
    setUrlInput(value || "");
    setImageError(false);
    setErrorMessage(null);
  }, [value]);

  const validateUrl = (url: string): { valid: boolean; error?: string } => {
    const trimmed = url.trim();
    if (!trimmed) {
      return { valid: true }; // empty is allowed (clearing)
    }

    const lower = trimmed.toLowerCase();
    if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
      return { valid: false, error: "Unsafe URL protocol detected. Only HTTP, HTTPS, or relative media paths are allowed." };
    }

    if (
      !lower.startsWith("http://") &&
      !lower.startsWith("https://") &&
      !lower.startsWith("/api/media/") &&
      !lower.startsWith("api/media/") &&
      !lower.startsWith("/uploads/") &&
      !lower.startsWith("uploads/") &&
      !lower.startsWith("/")
    ) {
      return { valid: false, error: "Please enter a valid absolute URL (https://...) or relative media path (/api/media/...)." };
    }

    return { valid: true };
  };

  const handleUrlApply = () => {
    const check = validateUrl(urlInput);
    if (!check.valid) {
      setErrorMessage(check.error || "Invalid URL");
      return;
    }

    setErrorMessage(null);
    setImageError(false);
    onChange(urlInput.trim());
    setSuccessMessage("Image URL updated");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if needed
    e.target.value = "";

    // Validate MIME type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validMimes.includes(file.type.toLowerCase())) {
      setErrorMessage(`Invalid file format (${file.type}). Allowed formats: ${allowedFormats.join(", ")}`);
      return;
    }

    // Validate size
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(`File exceeds maximum size of ${maxSizeMb} MB (Selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    if (!onUploadFile) {
      setErrorMessage("File upload handler is not configured for this field.");
      return;
    }

    try {
      setUploading(true);
      setErrorMessage(null);
      setImageError(false);

      const result = await onUploadFile(file);
      const newUrl = typeof result === "string" ? result : result.url;

      onChange(newUrl);
      setUrlInput(newUrl);
      setSuccessMessage("File uploaded successfully");
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      setErrorMessage(null);
      if (onDeleteImage) {
        await onDeleteImage();
      }
      onChange("");
      setUrlInput("");
      setImageError(false);
      setSuccessMessage("Image removed");
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to remove image.");
    } finally {
      setUploading(false);
    }
  };

  const hasImage = Boolean(value && value.trim());
  const resolvedPreviewUrl = hasImage ? getMediaUrl(value) : null;

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-800">
            {label}
          </label>
          {helperText && (
            <span className="text-[11px] text-slate-500 font-mono">
              {helperText}
            </span>
          )}
        </div>
      )}

      {/* Media Preview Card */}
      <div className="relative rounded-lg border border-slate-200 bg-slate-900 overflow-hidden shadow-2xs group">
        {hasImage && resolvedPreviewUrl && !imageError ? (
          <div className="relative w-full h-48 sm:h-56 bg-slate-950 flex items-center justify-center overflow-hidden">
            <img
              src={resolvedPreviewUrl}
              alt="Media preview"
              className="w-full h-full object-contain sm:object-cover select-none transition-all duration-300"
              onError={() => setImageError(true)}
            />
            {/* Dark gradient for metadata overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 pointer-events-none" />

            {/* Top status tag */}
            <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>LIVE PREVIEW</span>
            </div>

            {/* Bottom URL badge */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-slate-300 text-[11px] font-mono truncate px-1">
              <span className="truncate max-w-[80%]" title={value}>
                {value}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                {aspectRatio}
              </span>
            </div>
          </div>
        ) : hasImage && imageError ? (
          /* Error State Fallback */
          <div className="w-full h-48 sm:h-56 bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-rose-300 space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <span className="text-xs font-semibold text-rose-200">
              Image preview unavailable
            </span>
            <p className="text-[11px] text-slate-400 max-w-sm font-mono truncate">
              {value}
            </p>
            <span className="text-[10px] text-slate-500">
              The image could not be loaded from storage or network. Replace or remove it below.
            </span>
          </div>
        ) : (
          /* Empty / Placeholder State */
          <div className="w-full h-44 sm:h-48 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 mb-1 border border-slate-700">
              <ImageIcon className="w-5 h-5 opacity-70" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              No media configured
            </span>
            <span className="text-[11px] text-slate-400 max-w-xs">
              Upload a high-resolution image or paste a valid storage URL below.
            </span>
          </div>
        )}

        {/* Loading overlay during file upload or delete */}
        {uploading && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 z-20">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-xs font-semibold tracking-wide">
              Processing media...
            </span>
          </div>
        )}
      </div>

      {/* Mode Tabs & Action Controls */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex space-x-1">
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => setActiveTab("upload")}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                activeTab === "upload"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span className="inline-flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Local Image</span>
              </span>
            </button>
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => setActiveTab("url")}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                activeTab === "url"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span className="inline-flex items-center space-x-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Paste Image URL</span>
              </span>
            </button>
          </div>

          {/* Quick Remove / Clear action */}
          {hasImage && (
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={handleRemove}
              className="inline-flex items-center space-x-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition"
              title="Remove current image"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === "upload" && (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled || uploading}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition disabled:opacity-50 shadow-2xs cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Upload className="w-4 h-4 text-amber-400" />
                )}
                <span>
                  {hasImage ? "Replace with Local File" : "Choose File to Upload"}
                </span>
              </button>
              <span className="text-[11px] text-slate-500 font-mono">
                Click to browse local device (up to {maxSizeMb} MB)
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: URL Input */}
        {activeTab === "url" && (
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={urlInput}
                disabled={disabled || uploading}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setErrorMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlApply();
                  }
                }}
                placeholder={placeholder}
                className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-md text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-900"
              />
              {urlInput && (
                <button
                  type="button"
                  onClick={() => setUrlInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={disabled || uploading || urlInput.trim() === value.trim()}
              onClick={handleUrlApply}
              className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition disabled:opacity-40 shadow-2xs"
            >
              Apply URL
            </button>
          </div>
        )}

        {/* Feedback messages */}
        {errorMessage && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* Permanently displayed dimension specifications */}
      <MediaDimensionHint
        recommendedWidth={recommendedWidth}
        recommendedHeight={recommendedHeight}
        aspectRatio={aspectRatio}
        allowedFormats={allowedFormats}
        maxSizeMb={maxSizeMb}
      />
    </div>
  );
}
