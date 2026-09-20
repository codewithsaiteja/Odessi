"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full bg-[#FAF9F6] text-[#080808] flex flex-col lg:flex-row overflow-hidden selection:bg-[#B89A5A] selection:text-black">
      {/* ── Left / Visual Panel (Desktop 52% width) ── */}
      <div className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] bg-[#080808] flex-col justify-between p-12 xl:p-16 select-none overflow-hidden">
        {/* Cinematic High-Res Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1536922246289-88c42f957773?w=1800&q=90"
          alt="Odessi.tfi Editorial Campaign"
          fill
          priority
          quality={90}
          className="object-cover object-center opacity-65 scale-100 transition-transform duration-[2000ms] hover:scale-105"
        />

        {/* Gradient Vignette Overlay for Text Legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 z-10"
        />

        {/* Top Header — Logo Mark */}
        <div className="relative z-20 flex items-center justify-between">
          <Link href="/" aria-label="Odessi.tfi Home" className="inline-block group">
            <Image
              src="/logo-light.svg"
              alt="Odessi.tfi"
              width={200}
              height={40}
              priority
              className="h-10 w-auto object-contain transition-opacity group-hover:opacity-80"
            />
          </Link>
          <span className="text-[10px] tracking-[0.25em] text-[#B89A5A] uppercase font-mono font-medium">
            SS 2026 EDITION
          </span>
        </div>

        {/* Center Editorial Typography */}
        <div className="relative z-20 max-w-lg my-auto py-12">
          <p className="text-[11px] tracking-[0.3em] text-[#B89A5A] uppercase font-semibold mb-3">
            ODESSI.TFI
          </p>
          <h2 className="type-display text-5xl xl:text-6xl text-[#F3F0E8] font-light leading-[0.95] mb-4">
            WEAR YOUR
            <br />
            STORY.
          </h2>
          <p className="text-xs tracking-[0.25em] text-[#B0B0B0] uppercase font-medium">
            Enter the world of Odessi.
          </p>
        </div>

        {/* Bottom Tagline */}
        <div className="relative z-20 flex items-center justify-between border-t border-white/15 pt-6">
          <span className="text-[10px] tracking-[0.2em] text-[#9C978E] uppercase">
            Premium • Custom • Iconic
          </span>
          <span className="text-[10px] tracking-[0.2em] text-[#9C978E] uppercase">
            odessi.shop
          </span>
        </div>
      </div>

      {/* ── Right / Form Panel (Desktop 48% width, Mobile 100% width) ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[#FAF9F6]">
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#7A7A7A] hover:text-[#080808] transition-colors uppercase"
          >
            <ArrowLeft size={15} strokeWidth={1.5} />
            <span>Return to Store</span>
          </Link>
        </div>

        {/* Mobile Brand Banner (<1024px) */}
        <div className="lg:hidden mb-8 p-6 bg-[#080808] rounded-sm text-center relative overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1536922246289-88c42f957773?w=900&q=85"
            alt="Odessi.tfi Mobile Banner"
            fill
            className="object-cover opacity-40"
          />
          <div className="relative z-10 flex flex-col items-center">
            <Image
              src="/logo-light.svg"
              alt="Odessi.tfi"
              width={160}
              height={32}
              priority
              className="h-8 w-auto object-contain mb-2"
            />
            <p className="text-[10px] tracking-[0.25em] text-[#F3F0E8] uppercase font-serif">
              WEAR YOUR STORY.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          {children}
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center text-[11px] text-[#7A7A7A] tracking-wider uppercase">
          © {new Date().getFullYear()} ODESSI.TFI. ALL RIGHTS RESERVED.
        </div>
      </div>
    </div>
  );
}
