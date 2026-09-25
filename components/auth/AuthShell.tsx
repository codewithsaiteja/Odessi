"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BackButton from "@/components/navigation/BackButton";

interface AuthShellProps {
  children: React.ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full bg-[#080808] text-[#F3F0E8] flex flex-col lg:flex-row overflow-hidden selection:bg-[#B89A5A] selection:text-black">
      {/* ── Left / Visual Panel (Desktop 52% width) ── */}
      <div className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] bg-[#080808] flex-col justify-between p-12 xl:p-16 select-none overflow-hidden border-r border-[#1F1F1F]">
        {/* Cinematic High-Res Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1536922246289-88c42f957773?w=1800&q=90"
          alt="Odessi.tfi Editorial Campaign"
          fill
          priority
          quality={90}
          className="object-cover object-center opacity-55 scale-100 transition-transform duration-[2000ms] hover:scale-105"
        />

        {/* Gradient Vignette Overlay for Text Legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-[#080808]/40 z-10"
        />

        {/* Subtle Micro-Glow Accent */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 w-96 h-96 bg-[#B89A5A]/15 rounded-full blur-3xl z-10 pointer-events-none"
        />

        {/* Top Header — Logo Mark */}
        <div className="relative z-20 flex items-center justify-between">
          <Link href="/" aria-label="Odessi.tfi Home" className="inline-block group">
            <Image
              src="/logo-light.png"
              alt="Odessi.tfi"
              width={200}
              height={40}
              priority
              className="h-10 w-auto object-contain transition-opacity group-hover:opacity-80"
            />
          </Link>
          <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-bold bg-[#B89A5A]/10 border border-[#B89A5A]/30 px-3 py-1 rounded-full">
            SS 2026 EDITION
          </span>
        </div>

        {/* Center Editorial Typography */}
        <div className="relative z-20 max-w-lg my-auto py-12">
          <p className="text-[11px] tracking-[0.3em] text-[#B89A5A] uppercase font-mono font-bold mb-3 flex items-center gap-2">
            <span className="w-6 h-[1px] bg-[#B89A5A]" />
            ODESSI.TFI LUXURY HAUTE
          </p>
          <h2 className="type-display text-5xl xl:text-6xl text-[#F3F0E8] font-light leading-[0.95] mb-4 font-serif">
            WEAR YOUR
            <br />
            STORY.
          </h2>
          <p className="text-xs tracking-[0.25em] text-[#A3A3A3] uppercase font-medium">
            Enter the world of Odessi.
          </p>
        </div>

        {/* Bottom Tagline */}
        <div className="relative z-20 flex items-center justify-between border-t border-[#262626] pt-6">
          <span className="text-[10px] tracking-[0.2em] text-[#888888] uppercase font-mono">
            Premium • Custom • Iconic
          </span>
          <span className="text-[10px] tracking-[0.2em] text-[#888888] uppercase font-mono">
            odessi.shop
          </span>
        </div>
      </div>

      {/* ── Right / Form Panel (Desktop 48% width, Mobile 100% width) ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[#0D0D0D]">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <BackButton
            fallback="/shop"
            label="Return to Store"
            variant="light"
            className="!text-xs !font-bold tracking-wider !text-[#A3A3A3] hover:!text-[#B89A5A] uppercase font-mono"
          />
        </div>

        {/* Mobile Brand Banner (<1024px) */}
        <div className="lg:hidden mb-8 p-6 bg-[#141414] border border-[#262626] rounded-2xl text-center relative overflow-hidden shadow-xl">
          <Image
            src="https://images.unsplash.com/photo-1536922246289-88c42f957773?w=900&q=85"
            alt="Odessi.tfi Mobile Banner"
            fill
            className="object-cover opacity-30"
          />
          <div className="relative z-10 flex flex-col items-center">
            <Image
              src="/logo-light.png"
              alt="Odessi.tfi"
              width={160}
              height={32}
              priority
              className="h-8 w-auto object-contain mb-2"
            />
            <p className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-bold">
              WEAR YOUR STORY.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          {children}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-[11px] text-[#737373] tracking-widest uppercase font-mono">
          © {new Date().getFullYear()} ODESSI.TFI. ALL RIGHTS RESERVED.
        </div>
      </div>
    </div>
  );
}
