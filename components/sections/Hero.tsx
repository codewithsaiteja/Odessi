"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowDown } from "lucide-react";
import { siteConfig } from "@/config/site";

const Hero3DCanvas = dynamic(() => import("@/components/3d/Hero3DCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Image
        src="/logo-mark.svg"
        alt="Odessi Emblem"
        width={140}
        height={140}
        priority
        className="opacity-40 animate-pulse"
      />
    </div>
  ),
});

export default function Hero() {
  const { hero } = siteConfig;
  const scrollRef = useRef<HTMLButtonElement>(null);

  const scrollToContent = () => {
    const el = document.getElementById("featured-collection");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const headlineLines = hero.headline.split("\n");
  const subLines = hero.subHeadline.split("\n");

  return (
    <section
      aria-label="Hero"
      className="relative w-full overflow-hidden bg-[var(--color-odessi-black)]"
      style={{
        minHeight: "100svh",
        paddingTop: "calc(var(--announcement-height) + var(--navbar-height))",
      }}
    >
      {/* ── Background image ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src={hero.image}
          alt="Odessi.tfi — Premium Cinematic Clothing"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center select-none"
        />
        {/* Gradient overlay — bottom emphasis */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-1"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.08) 100%)",
          }}
        />
        {/* Left vignette for text legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-1 hidden md:block"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
          }}
        />
      </div>

      {/* ── Content Grid ── */}
      <div className="relative z-10 container-odessi h-full grid lg:grid-cols-12 gap-8 items-end pb-16 md:pb-20 lg:pb-24 min-h-[calc(100svh-var(--announcement-height)-var(--navbar-height))]">

        {/* Left Column: Copy & CTAs */}
        <div className="lg:col-span-7 flex flex-col justify-end">
          {/* Eyebrow */}
          <p className="type-caption text-[var(--color-odessi-silver)] mb-5">
            {siteConfig.name} — Premium Collection
          </p>

          {/* Headline */}
          <h1 className="mb-6" aria-label={hero.headline.replace("\n", " ")}>
            {headlineLines.map((line, i) => (
              <span key={i} className="block overflow-hidden">
                <span className="type-display text-white block">
                  {line}
                </span>
              </span>
            ))}
          </h1>

          {/* Sub-headline */}
          <div className="mb-10 max-w-md">
            {subLines.map((line, i) => (
              <p key={i} className="type-body text-[var(--color-odessi-silver)]">
                {line}
              </p>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link href={hero.primaryCta.href} className="btn-primary">
              {hero.primaryCta.label}
            </Link>
            <Link href={hero.secondaryCta.href} className="btn-secondary">
              {hero.secondaryCta.label}
            </Link>
          </div>
        </div>

        {/* Right Column: Premium 3D Emblem Showcase */}
        <div className="lg:col-span-5 hidden lg:flex flex-col items-center justify-center relative">
          <div className="w-full aspect-square max-w-[420px] relative pointer-events-auto cursor-grab active:cursor-grabbing">
            <Hero3DCanvas />
            
            {/* Subtle floating 3D badge label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] tracking-widest text-[var(--color-odessi-silver)] uppercase pointer-events-none">
              3D EMBLEM • WEAR YOUR STORY
            </div>
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <button
        ref={scrollRef}
        onClick={scrollToContent}
        aria-label="Scroll to content"
        className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 group"
      >
        <span className="type-caption text-[var(--color-odessi-silver)] group-hover:text-white transition-colors">
          Scroll
        </span>
        <ArrowDown
          size={16}
          strokeWidth={1.5}
          className="text-[var(--color-odessi-silver)] group-hover:text-white transition-colors animate-bounce"
          style={{ animationDuration: "2s" }}
        />
      </button>

      {/* ── Bottom rule ── */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-px bg-white/10 z-10"
      />
    </section>
  );
}
