import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function BrandStory() {
  const { brandStory } = siteConfig;
  const bodyParagraphs = brandStory.body.split("\n\n");

  return (
    <section
      aria-labelledby="brand-story-heading"
      className="relative overflow-hidden bg-[var(--color-odessi-black)]"
    >
      {/* Full-width image layer */}
      <div className="absolute inset-0">
        <Image
          src={brandStory.image}
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
      </div>

      {/* Content */}
      <div className="relative z-10 section-py">
        <div className="container-odessi">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <p className="type-caption text-[var(--color-odessi-stone)] mb-5">
              {brandStory.eyebrow}
            </p>

            {/* Rule */}
            <span className="divider bg-[var(--color-odessi-silver)] mb-6 block" aria-hidden="true" />

            {/* Headline */}
            <h2
              id="brand-story-heading"
              className="type-display text-white mb-10"
              style={{ lineHeight: 0.95 }}
            >
              {brandStory.headline.split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>

            {/* Body */}
            <div className="flex flex-col gap-5 mb-12">
              {bodyParagraphs.map((para, i) => (
                <p key={i} className="type-body text-[var(--color-odessi-silver)]">
                  {para}
                </p>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={brandStory.cta.href}
              className="btn-secondary inline-flex"
            >
              {brandStory.cta.label}
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
          src={brandStory.image}
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
