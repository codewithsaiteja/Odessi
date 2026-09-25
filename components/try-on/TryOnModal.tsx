"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Camera, RefreshCw, AlertCircle, Sparkles, Check, Download, Video, ShieldCheck } from "lucide-react";
import type { Product } from "@/types";
import { getTryOnToken, type TryOnTokenResponse } from "@/lib/api/try-on";

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  selectedVariantSku?: string;
}

type TryOnStatus =
  | "idle"
  | "requesting_camera"
  | "minting_token"
  | "connecting_vton"
  | "live"
  | "error";

export function TryOnModal({
  isOpen,
  onClose,
  product,
  selectedVariantSku,
}: TryOnModalProps) {
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [showLocalPip, setShowLocalPip] = useState<boolean>(true);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TryOnTokenResponse | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  // Using any for the realtime client reference to support dynamic import of @decartai/sdk
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realtimeClientRef = useRef<any>(null);

  // Safe and thorough cleanup of all camera tracks and WebRTC connections
  const cleanupSession = useCallback(() => {
    if (realtimeClientRef.current) {
      try {
        realtimeClientRef.current.disconnect?.();
      } catch (err) {
        console.warn("[TryOn] Failed to cleanly disconnect realtime client:", err);
      }
      realtimeClientRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn("[TryOn] Failed to stop track:", err);
        }
      });
      cameraStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    cleanupSession();
    setStatus("idle");
    setErrorMessage(null);
    setSnapshotUrl(null);
    onClose();
  }, [cleanupSession, onClose]);

  // Start the Virtual Try-On workflow
  const startTryOn = useCallback(async () => {
    cleanupSession();
    setErrorMessage(null);
    setSnapshotUrl(null);

    // 1. Verify browser support for getUserMedia
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage("Camera access is not supported by your browser. Please try Chrome, Safari, or Edge.");
      return;
    }

    try {
      // 2. Request Camera permission and stream
      setStatus("requesting_camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;

      // Attach stream to local preview video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // 3. Acquire short-lived token and garment image from Odessi backend
      setStatus("minting_token");
      const tokenRes = await getTryOnToken({
        productId: product.id,
        productSlug: product.slug,
        selectedVariantSku,
      });
      setTokenData(tokenRes);

      // 4. Dynamically import @decartai/sdk on-demand
      setStatus("connecting_vton");
      const { createDecartClient, models } = await import("@decartai/sdk");

      const decartClient = createDecartClient({
        apiKey: tokenRes.clientToken,
      });

      // Use the canonical or configured Lucy model
      const modelName = (tokenRes.model || "lucy-vton-3.5") as Parameters<typeof models.realtime>[0];
      const modelDef = models.realtime(modelName);

      // Pre-fetch garment image as Blob if possible to ensure resilience against cross-origin drops
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let garmentImageInput: any = tokenRes.garmentImageUrl;
      if (tokenRes.garmentImageUrl) {
        try {
          const imgResp = await fetch(tokenRes.garmentImageUrl, { mode: "cors" });
          if (imgResp.ok) {
            const blob = await imgResp.blob();
            garmentImageInput = blob;
          }
        } catch (fetchErr) {
          console.warn("[TryOn] Garment pre-fetch as blob failed, using direct URL:", fetchErr);
          garmentImageInput = tokenRes.garmentImageUrl;
        }
      }

      const realtimeSession = await decartClient.realtime.connect(stream, {
        model: modelDef,
        initialState: {
          prompt: {
            text: `Wearing ${tokenRes.productName || product.name}`,
            enhance: false,
          },
          image: garmentImageInput,
        },
        mirror: cameraFacing === "user" ? "auto" : false,
        speed: "fast",
        onRemoteStream: (remoteStream: MediaStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => {});
          }
          setStatus("live");
        },
        onConnectionChange: (state) => {
          if (state === "disconnected" || state === "reconnecting") {
            console.warn("[TryOn] Realtime session connection state:", state);
          }
        },
      });

      realtimeClientRef.current = realtimeSession;
    } catch (err: unknown) {
      console.error("[TryOn] Encountered error during Virtual Try-On startup:", err);
      cleanupSession();
      setStatus("error");

      const error = err as { name?: string; message?: string };
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setErrorMessage("Camera permission was denied. Please allow camera access in your browser settings to try on garments.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        setErrorMessage("No camera was detected on this device. Please connect a webcam.");
      } else if (error.message?.includes("unavailable") || error.message?.includes("503")) {
        setErrorMessage(error.message || "Virtual Try-On is currently undergoing maintenance. Please try again soon.");
      } else {
        setErrorMessage(error.message || "Failed to initialize live virtual try-on. Please check your network connection and try again.");
      }
    }
  }, [cameraFacing, cleanupSession, product.id, product.name, product.slug, selectedVariantSku]);

  // Trigger try-on when modal is opened
  useEffect(() => {
    if (isOpen) {
      startTryOn();
    } else {
      cleanupSession();
      setStatus("idle");
    }

    return () => {
      cleanupSession();
    };
  }, [isOpen, startTryOn, cleanupSession]);

  // Flip camera (front/back)
  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Re-run startTryOn when camera facing mode is changed if already opened
  useEffect(() => {
    if (isOpen && status !== "idle" && status !== "error") {
      startTryOn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraFacing]);

  // Capture a snapshot of the remote stream
  const captureSnapshot = () => {
    const video = remoteVideoRef.current || localVideoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setSnapshotUrl(dataUrl);
      }
    } catch (err) {
      console.error("[TryOn] Failed to capture snapshot:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="try-on-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md transition-opacity duration-300"
    >
      <div className="relative w-full max-w-4xl bg-[#0F0F0F] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80 bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-neutral-900 border border-neutral-700/60 text-[#D4AF37]">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 id="try-on-title" className="text-sm font-semibold tracking-wider uppercase text-white flex items-center gap-2">
                Decart Lucy VTON
                <span className="text-[10px] tracking-widest px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30">
                  REAL-TIME
                </span>
              </h2>
              <p className="text-xs text-neutral-400 truncate max-w-xs sm:max-w-md">
                Trying on: <span className="text-neutral-200 font-medium">{product.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              aria-label="Close try-on modal"
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Viewport Container */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[380px] sm:min-h-[500px] overflow-hidden">
          {/* Remote Transformed VTON Stream */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain ${status === "live" ? "block" : "hidden"}`}
          />

          {/* Local Camera Fallback / Connecting View */}
          {status !== "live" && status !== "error" && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain opacity-40 blur-sm scale-x-[-1]"
            />
          )}

          {/* Corner PIP for Local Camera Feed during Live Session */}
          {status === "live" && showLocalPip && (
            <div className="absolute bottom-5 right-5 w-36 sm:w-44 aspect-video rounded-lg overflow-hidden border border-white/20 shadow-2xl bg-black/60 z-20 transition-transform duration-200 hover:scale-105">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <span className="absolute bottom-1 left-2 text-[9px] tracking-wider uppercase text-white/80 font-mono bg-black/60 px-1 rounded">
                Camera Feed
              </span>
            </div>
          )}

          {/* Loading States Overlay */}
          {status !== "live" && status !== "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-black/40">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-[#D4AF37]">
                  <Camera size={22} />
                </div>
              </div>

              <h3 className="text-white text-base font-medium mb-1">
                {status === "requesting_camera" && "Requesting Camera Access..."}
                {status === "minting_token" && "Securing Ephemeral Lucy Token..."}
                {status === "connecting_vton" && "Connecting to Decart Lucy Real-Time VTON..."}
              </h3>
              <p className="text-neutral-400 text-xs max-w-sm">
                {status === "requesting_camera" && "Please allow camera access in your browser prompt."}
                {status === "minting_token" && "Generating a private 5-minute session token for this garment."}
                {status === "connecting_vton" && "Establishing 30 FPS bidirectional WebRTC stream."}
              </p>
            </div>
          )}

          {/* Error State Overlay */}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-[#0F0F0F]/95">
              <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Unable to Start Try-On</h3>
              <p className="text-neutral-300 text-sm max-w-md mb-6 leading-relaxed">
                {errorMessage || "An unexpected error occurred while initiating the virtual try-on session."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={startTryOn}
                  className="px-5 py-2.5 rounded-sm bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  <span>Retry Session</span>
                </button>
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs tracking-wider uppercase transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Garment Indicator Card (Top Left overlay during live session) */}
          {status === "live" && tokenData && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-3 p-2 pr-3.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tokenData.garmentImageUrl}
                alt={product.name}
                className="w-10 h-10 object-cover rounded bg-neutral-900 border border-white/10"
              />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-400">
                    LUCY LIVE 30FPS
                  </span>
                </div>
                <p className="text-xs font-medium text-neutral-200 truncate max-w-[140px]">
                  {product.name}
                </p>
              </div>
            </div>
          )}

          {/* Snapshot Preview Modal Overlay */}
          {snapshotUrl && (
            <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
              <div className="relative max-w-md w-full rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={snapshotUrl} alt="Try-On Snapshot" className="w-full aspect-video object-contain bg-black" />
                <div className="p-4 flex items-center justify-between bg-neutral-900 border-t border-neutral-800">
                  <div className="text-left">
                    <p className="text-xs font-medium text-white">Virtual Try-On Look</p>
                    <p className="text-[10px] text-neutral-400">Odessi • Lucy VTON</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={snapshotUrl}
                      download={`odessi-tryon-${product.slug}.png`}
                      className="px-3 py-1.5 rounded bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 transition-colors"
                    >
                      <Download size={13} />
                      <span>Save</span>
                    </a>
                    <button
                      onClick={() => setSnapshotUrl(null)}
                      className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-neutral-800/80 bg-[#141414] text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <ShieldCheck size={14} className="text-[#D4AF37]" />
            <span className="hidden sm:inline">Camera frames processed in real-time. No video is recorded or stored.</span>
            <span className="sm:hidden">Zero video data recorded.</span>
          </div>

          <div className="flex items-center gap-2">
            {status === "live" && (
              <>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  title="Switch camera"
                  className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowLocalPip(!showLocalPip)}
                  title="Toggle PIP"
                  className={`p-2 rounded-lg transition-colors ${
                    showLocalPip
                      ? "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Video size={15} />
                </button>
                <button
                  type="button"
                  onClick={captureSnapshot}
                  className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Camera size={14} />
                  <span>Snapshot</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TryOnModal;
