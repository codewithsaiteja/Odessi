"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getHomepageContent, HomepageSection } from "@/lib/api/content";
import BlurText from "@/components/react-bits/text/BlurText";
import ScrollReveal from "@/components/react-bits/text/ScrollReveal";
import Noise from "@/components/react-bits/backgrounds/Noise";

export default function BrandStory() {
  const { brandStory: defaultStory } = siteConfig;
  const [storyData, setStoryData] = useState<HomepageSection | null>(null);

  useEffect(() => {
    getHomepageContent()
      .then((sections) => {
        const found = sections.find((s) => s.sectionKey === "BRAND_STORY");
        if (found) {
          setStoryData(found);
        }
      })
      .catch(() => {
        // Fallback gracefully
      });
  }, []);

  if (storyData && !storyData.active) return null;

  const eyebrow = storyData?.eyebrow || defaultStory.eyebrow;
  const headline = storyData?.headline || defaultStory.headline;
  const body = storyData?.body || defaultStory.body;
  const bgImage = storyData?.mediaUrl || defaultStory.image;
  const ctaLabel = storyData?.primaryCtaLabel || defaultStory.cta.label;
  const ctaHref = storyData?.primaryCtaUrl || defaultStory.cta.href;

  const bodyParagraphs = body.split("\n\n");

  return (
    <section
      aria-labelledby="brand-story-heading"
      className="relative overflow-hidden bg-[var(--color-odessi-black)]"
    >
      {/* Full-width image layer */}
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt="Odessi.tfi brand story"
          fill
          sizes="100vw"
          className="object-cover object-center opacity-30 select-none"
        />
        {/* Texture overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 100%)",
          }}
        />
        <Noise patternAlpha={4} className="z-1" />
      </div>

      {/* Content */}
      <div className="relative z-10 section-py">
        <div className="container-odessi">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <p className="type-caption text-[var(--color-odessi-stone)] mb-5">
              {eyebrow}
            </p>

            {/* Rule */}
            <span className="divider bg-[var(--color-odessi-silver)] mb-6 block" aria-hidden="true" />

            {/* Headline */}
            <h2
              id="brand-story-heading"
              className="type-display text-white mb-10"
              style={{ lineHeight: 0.95 }}
            >
              {headline.split("\n").map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <BlurText
                    text={line}
                    delay={75}
                    animateBy="words"
                    className="type-display text-white block"
                  />
                </span>
              ))}
            </h2>

            {/* Body */}
            <div className="flex flex-col gap-5 mb-12">
              {bodyParagraphs.map((para, i) => (
                <ScrollReveal
                  key={i}
                  enableBlur={true}
                  baseOpacity={0.25}
                  blurStrength={3}
                  textClassName="type-body text-[var(--color-odessi-silver)]"
                >
                  {para}
                </ScrollReveal>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={ctaHref}
              className="btn-secondary inline-flex"
            >
              {ctaLabel}
              <ArrowRight size={14} strokeWidth={2} className="ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Right editorial image visible on large screens */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 bottom-0 w-1/2 hidden xl:block"
      >
        <Image
          src={bgImage}
          alt=""
          fill
          sizes="50vw"
          className="object-cover object-center opacity-50 select-none"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, var(--color-odessi-black) 0%, transparent 30%)",
          }}
        />
      </div>
    </section>
  );
}
