"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getHomepageContent, HomepageSection } from "@/lib/api/content";
import BlurText from "@/components/react-bits/text/BlurText";
import ShinyText from "@/components/react-bits/text/ShinyText";
import Noise from "@/components/react-bits/backgrounds/Noise";
import { getMediaUrl } from "@/lib/product-utils";

import HeroEmblem3D from "@/components/home/HeroEmblem3D";

export default function Hero() {
  const { hero: defaultHero } = siteConfig;
  const [heroData, setHeroData] = useState<HomepageSection | null>(null);
  const scrollRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getHomepageContent()
      .then((sections) => {
        const found = sections.find((s) => s.sectionKey === "HERO" && s.active);
        if (found) {
          setHeroData(found);
        }
      })
      .catch(() => {
        // Fallback gracefully to default siteConfig
      });
  }, []);

  const scrollToContent = () => {
    const el = document.getElementById("featured-collection");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  const eyebrow = heroData?.eyebrow || `${siteConfig.name} — Premium Collection`;
  const headline = heroData?.headline || defaultHero.headline;
  const subHeadline = heroData?.subHeadline || defaultHero.subHeadline;
  const rawDesktop = heroData?.mediaUrl || defaultHero.image;
  const rawMobile = heroData?.mobileMediaUrl;
  const desktopBgImage = getMediaUrl(rawDesktop);
  const mobileBgImage = rawMobile ? getMediaUrl(rawMobile) : null;
  const primaryCtaLabel = heroData?.primaryCtaLabel || defaultHero.primaryCta.label;
  const primaryCtaUrl = heroData?.primaryCtaUrl || defaultHero.primaryCta.href;
  const secondaryCtaLabel = heroData?.secondaryCtaLabel || defaultHero.secondaryCta.label;
  const secondaryCtaUrl = heroData?.secondaryCtaUrl || defaultHero.secondaryCta.href;

  const headlineLines = headline.split("\n");
  const subLines = subHeadline.split("\n");

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
        {mobileBgImage ? (
          <>
            <Image
              src={mobileBgImage}
              alt="Odessi.tfi — Premium Cinematic Clothing"
              fill
              priority
              quality={90}
              sizes="100vw"
              className="md:hidden object-cover object-center select-none"
            />
            <Image
              src={desktopBgImage}
              alt="Odessi.tfi — Premium Cinematic Clothing"
              fill
              priority
              quality={90}
              sizes="100vw"
              className="hidden md:block object-cover object-center select-none"
            />
          </>
        ) : (
          <Image
            src={desktopBgImage}
            alt="Odessi.tfi — Premium Cinematic Clothing"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-center select-none"
          />
        )}
        {/* Gradient overlay — bottom emphasis */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-1"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.1) 100%)",
          }}
        />
        {/* Left vignette for text legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-1 hidden md:block"
          style={{
            background:
              "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)",
          }}
        />
        {/* Subtle cinematic film grain */}
        <Noise patternAlpha={4} className="z-2" />
      </div>

      {/* ── Content Grid: Editorial Luxury Layout with 3D Brand Emblem ── */}
      <div className="relative z-10 container-odessi h-full flex flex-col justify-end pb-16 md:pb-20 lg:pb-24 min-h-[calc(100svh-var(--announcement-height)-var(--navbar-height))]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end w-full">
          {/* Left: Headline & CTAs */}
          <div className="lg:col-span-8 max-w-2xl flex flex-col justify-end">
            {/* Eyebrow */}
            <div className="mb-5">
              <ShinyText
                text={eyebrow}
                color="#A6A097"
                shineColor="#FAF9F6"
                speed={3}
                className="type-caption text-[var(--color-odessi-silver)]"
              />
            </div>

            {/* Headline */}
            <h1 className="mb-6" aria-label={headline.replace("\n", " ")}>
              {headlineLines.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <BlurText
                    text={line}
                    delay={80}
                    animateBy="words"
                    className="type-display text-white block"
                  />
                </span>
              ))}
            </h1>

            {/* Sub-headline */}
            <div className="mb-10 max-w-lg">
              {subLines.map((line, i) => (
                <p key={i} className="type-body text-[var(--color-odessi-silver)]">
                  {line}
                </p>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href={primaryCtaUrl} className="btn-primary">
                {primaryCtaLabel}
              </Link>
              {secondaryCtaLabel && secondaryCtaUrl && (
                <Link href={secondaryCtaUrl} className="btn-secondary">
                  {secondaryCtaLabel}
                </Link>
              )}
            </div>
          </div>

          {/* Right: Floating 3D Brand Emblem in space (desktop) */}
          <div className="hidden lg:flex lg:col-span-4 items-center justify-end pb-8 pr-4">
            <HeroEmblem3D />
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <button
        ref={scrollRef}
        onClick={scrollToContent}
        aria-label="Scroll to content"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
      >
        <span className="type-caption text-[#9c978e] group-hover:text-[#f3f0e8] transition-colors duration-200">
          Scroll
        </span>
        <ArrowDown
          size={14}
          strokeWidth={1.5}
          className="text-[#9c978e] group-hover:text-[#f3f0e8] group-hover:translate-y-1 transition-all duration-300"
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
