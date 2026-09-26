"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Camera,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Download,
  Video,
  ShieldCheck,
  Lock,
  CameraOff,
  Radio,
  ArrowLeft,
  Move,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import type { Product } from "@/types";
import { getTryOnToken, type TryOnTokenResponse } from "@/lib/api/try-on";

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  selectedVariantSku?: string;
  initialMode?: "native" | "anywear";
}

export type TryOnStatus =
  | "idle"
  | "requesting_camera"
  | "camera_ready"
  | "minting_token"
  | "fetching_garment"
  | "connecting_vton"
  | "waiting_for_remote_stream"
  | "live"
  | "camera_permission_denied"
  | "camera_not_found"
  | "camera_in_use"
  | "camera_initialization_failed"
  | "try_on_token_failed"
  | "garment_fetch_failed"
  | "decart_connection_failed"
  | "remote_stream_timeout";

/**
 * Direct browser camera test & progressive fallback.
 * Emits [TryOn] getUserMedia called and tests hardware access.
 */
async function acquireCameraStream(facingMode: "user" | "environment"): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("CAMERA_UNSUPPORTED");
  }

  console.log("[TryOn] getUserMedia called");

  // If rear/environment camera specifically requested on mobile
  if (facingMode === "environment") {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
    } catch (err: unknown) {
      console.warn("[TryOn] environment camera constraint failed, falling back to unconstrained video:", err);
    }
  }

  // Universal unconstrained video query (direct browser camera test, works on all desktop and mobile cameras)
  return await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
}

export function TryOnModal({
  isOpen,
  onClose,
  product,
  selectedVariantSku,
  initialMode = "anywear",
}: TryOnModalProps) {
  const [activeTab, setActiveTab] = useState<"native" | "anywear">(initialMode || "anywear");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [showLocalPip, setShowLocalPip] = useState<boolean>(true);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TryOnTokenResponse | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Derive absolute garment image URL for Decart Anywear ingestion
  const rawGarmentUrl = tokenData?.garmentImageUrl || (product.images && product.images[0]) || product.thumbnail || "";
  const defaultApi = process.env.NODE_ENV === "production" ? "https://odessi-backend.onrender.com" : "http://localhost:8080";
  const backendUrl = (process.env.NEXT_PUBLIC_API_URL || defaultApi).trim().replace(/\/+$/, "");
  const garmentImageUrl = rawGarmentUrl.startsWith("http")
    ? rawGarmentUrl
    : rawGarmentUrl.startsWith("/")
    ? `${backendUrl}${rawGarmentUrl}`
    : `${backendUrl}/${rawGarmentUrl}`;

  const handleDragStart = (e: React.DragEvent<HTMLImageElement>) => {
    e.dataTransfer.setData("text/plain", garmentImageUrl);
    e.dataTransfer.setData("text/uri-list", garmentImageUrl);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(garmentImageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realtimeClientRef = useRef<any>(null);
  const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<TryOnStatus>("idle");

  // Keep statusRef synchronized with state for asynchronous timers
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Safe and thorough cleanup of all camera tracks and WebRTC connections
  const cleanupSession = useCallback(() => {
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }

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
    if (pipVideoRef.current) {
      pipVideoRef.current.srcObject = null;
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
      setStatus("camera_initialization_failed");
      setErrorMessage("Camera access is not supported by your browser. Please try Chrome, Safari, or Edge.");
      return;
    }

    // 2. Query camera permission state for telemetry (non-blocking)
    try {
      if (typeof navigator !== "undefined" && navigator.permissions?.query) {
        const perm = await navigator.permissions.query({ name: "camera" as PermissionName });
        console.log("[TryOn] camera permission state", perm.state);
      }
    } catch {
      console.log("[TryOn] camera permission state", "query_unsupported");
    }

    // Direct Browser Camera Test
    setStatus("requesting_camera");

    let stream: MediaStream;
    try {
      stream = await acquireCameraStream(cameraFacing);
      cameraStreamRef.current = stream;
      console.log("[TryOn] getUserMedia success");

      // Attach stream to local preview video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      console.log("[TryOn] camera stream attached");
      setStatus("camera_ready");
    } catch (camErr: unknown) {
      const error = camErr as { name?: string; message?: string };
      console.warn("[TryOn] Camera acquisition error:", error?.name, error?.message);

      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        setStatus("camera_permission_denied");
        setErrorMessage("Camera permission was denied. Please allow camera access in your browser settings to try on garments.");
      } else if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
        setStatus("camera_not_found");
        setErrorMessage("No camera detected on this device. Please connect a webcam or open this page on your mobile device.");
      } else if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
        setStatus("camera_in_use");
        setErrorMessage("Your camera is currently in use by another app or browser tab. Please close other camera apps and retry.");
      } else {
        setStatus("camera_initialization_failed");
        setErrorMessage(error?.message || "Failed to initialize camera. Please check your device settings.");
      }
      return;
    }

    // 3. Acquire short-lived token and garment image from Odessi backend
    console.log("[TryOn] requesting token");
    setStatus("minting_token");
    let tokenRes: TryOnTokenResponse;
    try {
      tokenRes = await getTryOnToken({
        productId: product.id,
        productSlug: product.slug,
        selectedVariantSku,
      });
      console.log("[TryOn] token received");
      setTokenData(tokenRes);
    } catch (tokErr: unknown) {
      const error = tokErr as { message?: string };
      console.error("[TryOn] Failed to acquire try-on token:", tokErr);
      cleanupSession();
      setStatus("try_on_token_failed");
      setErrorMessage(error?.message || "Virtual Try-On service is temporarily unavailable. Please try again later.");
      return;
    }

    // 4. Model selection
    const modelName = (tokenRes.model || "lucy-vton-3.5") as Parameters<typeof models.realtime>[0];
    console.log("[TryOn] model selected", modelName);

    // 5. Fetch garment image
    setStatus("fetching_garment");
    if (!tokenRes.garmentImageUrl) {
      console.warn("[TryOn] Garment image URL is missing");
      cleanupSession();
      setStatus("garment_fetch_failed");
      setErrorMessage("Product garment image is unavailable for virtual try-on.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let garmentImageInput: any = tokenRes.garmentImageUrl;
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
    console.log("[TryOn] garment loaded");

    // 6. Connect to Decart Lucy Real-Time VTON via WebRTC
    const { createDecartClient, models } = await import("@decartai/sdk");

    const decartClient = createDecartClient({
      apiKey: tokenRes.clientToken,
    });
    console.log("[TryOn] Decart client created");

    const modelDef = models.realtime(modelName);
    console.log("[TryOn] realtime connect started");
    setStatus("connecting_vton");
    setStatus("waiting_for_remote_stream");

    // 15-second safeguard timeout for remote video arrival
    streamTimeoutRef.current = setTimeout(() => {
      if (statusRef.current !== "live") {
        console.warn("[TryOn] Decart remote video stream timed out after 15s");
        cleanupSession();
        setStatus("remote_stream_timeout");
        setErrorMessage("Live try-on stream timed out. Please check your network connection and retry.");
      }
    }, 15000);

    try {
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
        onRemoteStream: (remoteStream: MediaStream) => {
          console.log("[TryOn] remote stream received");
          if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
          }
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(() => {});
          }
          setStatus("live");
        },
        onConnectionChange: (state) => {
          console.log("[TryOn] realtime connection state", state);
          if (state === "disconnected" || state === "reconnecting") {
            console.warn("[TryOn] Realtime session connection state:", state);
          }
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      realtimeSession.on("error", (err: any) => {
        console.error("[TryOn] Decart error", err);
        cleanupSession();
        setStatus("decart_connection_failed");
        setErrorMessage(err?.message || "Virtual try-on connection failed.");
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      realtimeSession.on("sessionEnded", (reason: any) => {
        console.warn("[TryOn] Decart session ended:", reason);
        cleanupSession();
        setStatus("decart_connection_failed");
        setErrorMessage("Virtual try-on session concluded.");
      });

      realtimeClientRef.current = realtimeSession;
    } catch (decartErr: unknown) {
      const error = decartErr as { message?: string };
      console.error("[TryOn] Decart error", decartErr);
      cleanupSession();
      setStatus("decart_connection_failed");
      setErrorMessage(error?.message || "Virtual try-on connection failed.");
    }
  }, [cameraFacing, cleanupSession, product.id, product.name, product.slug, selectedVariantSku]);

  const handleRecovery = useCallback(async () => {
    console.log("[TryOn] recovery button clicked");
    setIsRecovering(true);
    try {
      await startTryOn();
    } catch (err) {
      console.error("[TryOn] Recovery error:", err);
    } finally {
      setIsRecovering(false);
    }
  }, [startTryOn]);

  // Synchronize camera stream with picture-in-picture video element when live
  useEffect(() => {
    if (status === "live" && showLocalPip && pipVideoRef.current && cameraStreamRef.current) {
      pipVideoRef.current.srcObject = cameraStreamRef.current;
      pipVideoRef.current.play().catch(() => {});
    }
  }, [status, showLocalPip]);

  // Synchronize activeTab when modal is opened with initialMode
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode || "anywear");
    }
  }, [isOpen, initialMode]);

  // Trigger try-on conditionally based on activeTab
  useEffect(() => {
    if (isOpen) {
      if (activeTab === "native") {
        startTryOn();
      } else {
        cleanupSession();
      }
    } else {
      cleanupSession();
      setStatus("idle");
    }

    return () => {
      cleanupSession();
    };
  }, [isOpen, activeTab, startTryOn, cleanupSession]);

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Flip camera (front/back)
  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Re-run startTryOn when camera facing mode is changed if already opened
  useEffect(() => {
    if (isOpen && status !== "idle" && !isErrorState(status)) {
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

  function isErrorState(s: TryOnStatus): boolean {
    return (
      s === "camera_permission_denied" ||
      s === "camera_not_found" ||
      s === "camera_in_use" ||
      s === "camera_initialization_failed" ||
      s === "try_on_token_failed" ||
      s === "garment_fetch_failed" ||
      s === "decart_connection_failed" ||
      s === "remote_stream_timeout"
    );
  }

  function isLoadingState(s: TryOnStatus): boolean {
    return (
      s === "requesting_camera" ||
      s === "camera_ready" ||
      s === "minting_token" ||
      s === "fetching_garment" ||
      s === "connecting_vton" ||
      s === "waiting_for_remote_stream"
    );
  }

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
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 -ml-1 text-neutral-400 hover:text-white transition-colors rounded-lg flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold"
              aria-label="Back to Product"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-4 w-[1px] bg-neutral-700 mx-1 hidden sm:block" />
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
            onLoadedMetadata={() => console.log("[TryOn] remote video loaded")}
            onLoadedData={() => console.log("[TryOn] remote video loaded")}
            onPlaying={() => console.log("[TryOn] remote video playing")}
            className={`w-full h-full object-contain ${status === "live" ? "block" : "hidden"}`}
          />

          {/* Local Camera Fallback / Connecting View */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain scale-x-[-1] transition-opacity duration-300 ${
              status !== "live" && !isErrorState(status)
                ? "block opacity-40 blur-sm"
                : "hidden opacity-0 pointer-events-none"
            }`}
          />

          {/* Corner PIP for Local Camera Feed during Live Session */}
          {status === "live" && showLocalPip && (
            <div className="absolute bottom-5 right-5 w-36 sm:w-44 aspect-video rounded-lg overflow-hidden border border-white/20 shadow-2xl bg-black/60 z-20 transition-transform duration-200 hover:scale-105">
              <video
                ref={pipVideoRef}
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
          {isLoadingState(status) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-black/50 backdrop-blur-xs">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-[#D4AF37]">
                  <Camera size={22} />
                </div>
              </div>

              <h3 className="text-white text-base font-medium mb-1">
                {status === "requesting_camera" && "Requesting Camera Access..."}
                {status === "camera_ready" && "Camera Ready..."}
                {status === "minting_token" && "Securing Ephemeral Lucy Token..."}
                {status === "fetching_garment" && "Loading Garment Silhouette..."}
                {status === "connecting_vton" && "Connecting to Decart Lucy Real-Time VTON..."}
                {status === "waiting_for_remote_stream" && "Generating Real-Time Virtual Fit..."}
              </h3>
              <p className="text-neutral-400 text-xs max-w-sm">
                {status === "requesting_camera" && "Please allow camera access in your browser prompt."}
                {status === "camera_ready" && "Camera active. Initializing AI transformation pipeline."}
                {status === "minting_token" && "Generating a private 5-minute session token for this garment."}
                {status === "fetching_garment" && "Preparing garment imagery for real-time body tracking."}
                {status === "connecting_vton" && "Establishing 30 FPS bidirectional WebRTC stream."}
                {status === "waiting_for_remote_stream" && "Receiving real-time AI frames from Decart Lucy."}
              </p>
            </div>
          )}

          {/* Camera Permission Denied Overlay */}
          {status === "camera_permission_denied" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-[#0F0F0F]/95">
              <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] mb-4">
                <Lock size={32} />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Camera Access Blocked</h3>
              <p className="text-neutral-300 text-xs sm:text-sm max-w-md mb-4 leading-relaxed">
                Your browser has blocked camera access for <strong className="text-white">odessitfi.me</strong>.
                To experience Decart Lucy Virtual Try-On, please enable your camera:
              </p>

              {/* Step by step browser instructions */}
              <div className="w-full max-w-sm bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 text-left text-xs text-neutral-300 mb-6 space-y-1.5 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center text-[10px]">1</span>
                  <span>Click the <strong>Lock / Settings</strong> icon in the address bar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center text-[10px]">2</span>
                  <span>Set <strong>Camera</strong> to <strong>&ldquo;Allow&rdquo;</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#D4AF37] text-black font-bold flex items-center justify-center text-[10px]">3</span>
                  <span>Click <strong>&ldquo;I&apos;ve Allowed Access&rdquo;</strong> below</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRecovery}
                  disabled={isRecovering}
                  className="px-5 py-2.5 rounded-sm bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-60"
                >
                  <RefreshCw size={14} className={isRecovering ? "animate-spin" : ""} />
                  <span>{isRecovering ? "Connecting..." : "I\u0027ve Allowed Access"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Not Found Overlay */}
          {status === "camera_not_found" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-[#0F0F0F]/95">
              <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                <CameraOff size={32} />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">No Camera Detected</h3>
              <p className="text-neutral-300 text-sm max-w-md mb-6 leading-relaxed">
                {errorMessage || "We could not detect a webcam on this device. Please connect a webcam or try this on your mobile smartphone."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startTryOn()}
                  className="px-5 py-2.5 rounded-sm bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Check Again</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera In Use / Hardware Busy */}
          {status === "camera_in_use" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-[#0F0F0F]/95">
              <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] mb-4">
                <Radio size={32} />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Camera In Use</h3>
              <p className="text-neutral-300 text-sm max-w-md mb-6 leading-relaxed">
                {errorMessage || "Your camera is currently being used by another application (Zoom, Teams, or another tab)."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startTryOn()}
                  className="px-5 py-2.5 rounded-sm bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Retry Camera</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* Token Acquisition Failed */}
          {status === "try_on_token_failed" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-[#0F0F0F]/95">
              <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Try-On Service Unavailable</h3>
              <p className="text-neutral-300 text-sm max-w-md mb-6 leading-relaxed">
                {errorMessage || "Virtual Try-On service is temporarily unavailable. Please try again later."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startTryOn()}
                  className="px-5 py-2.5 rounded-sm bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* Garment Image Failed */}
          {status === "garment_fetch_failed" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-[#0F0F0F]/95">
              <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Product Garment Unavailable</h3>
              <p className="text-neutral-300 text-sm max-w-md mb-6 leading-relaxed">
                {errorMessage || "Could not load the garment silhouette for virtual try-on."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startTryOn()}
                  className="px-5 py-2.5 rounded-sm bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* Decart Connection Failed */}
          {status === "decart_connection_failed" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-[#0F0F0F]/95">
              <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Virtual Try-On Connection Failed</h3>
              <p className="text-neutral-300 text-sm max-w-md mb-6 leading-relaxed">
                {errorMessage || "Unable to connect to virtual try-on. Please try again."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startTryOn()}
                  className="px-5 py-2.5 rounded-sm bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Retry Session</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* Remote Stream Timed Out */}
          {status === "remote_stream_timeout" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-[#0F0F0F]/95">
              <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Live Try-On Stream Unavailable</h3>
              <p className="text-neutral-300 text-sm max-w-md mb-6 leading-relaxed">
                {errorMessage || "Live try-on stream timed out. Please check your network connection and retry."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startTryOn()}
                  className="px-5 py-2.5 rounded-sm bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Retry Session</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Initialization Failed */}
          {status === "camera_initialization_failed" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-[#0F0F0F]/95">
              <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-white text-lg font-semibold mb-2">Camera Initialization Failed</h3>
              <p className="text-neutral-300 text-sm max-w-md mb-6 leading-relaxed">
                {errorMessage || "Failed to initialize camera. Please check your device settings."}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startTryOn()}
                  className="px-5 py-2.5 rounded-sm bg-[#D4AF37] hover:bg-[#B89A5A] text-black font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Retry Camera</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-sm bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
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
                      type="button"
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
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition-colors cursor-pointer"
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
