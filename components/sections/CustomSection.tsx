import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function CustomSection() {
  const { custom } = siteConfig;
  const bodyParagraphs = custom.body.split("\n\n");

  return (
    <section
      aria-labelledby="custom-heading"
      className="relative overflow-hidden bg-[var(--color-odessi-black)]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px] lg:min-h-[580px]">

        {/* ── Left: Text ── */}
        <div className="relative z-10 flex items-center section-py order-2 lg:order-1">
          <div className="container-odessi lg:pl-[4rem] lg:pr-12 max-w-none">
            {/* Icon */}
            <div className="w-10 h-10 border border-[var(--color-odessi-graphite)] flex items-center justify-center mb-6">
              <Pencil size={16} strokeWidth={1.5} className="text-[var(--color-odessi-silver)]" />
            </div>

            {/* Eyebrow */}
            <p className="type-caption text-[var(--color-odessi-stone)] mb-5">
              {custom.eyebrow}
            </p>

            <span className="divider bg-[var(--color-odessi-graphite)] block mb-6" aria-hidden="true" />

            {/* Headline */}
            <h2
              id="custom-heading"
              className="text-white mb-8"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(2.5rem, 5vw, 5rem)",
                fontWeight: 300,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
              }}
            >
              {custom.headline.split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>

            {/* Body */}
            <div className="flex flex-col gap-4 mb-10 max-w-sm">
              {bodyParagraphs.map((para, i) => (
                <p key={i} className="type-body text-[var(--color-odessi-silver)]">
                  {para}
                </p>
              ))}
            </div>

            {/* CTA */}
            <Link href={custom.cta.href} className="btn-primary">
              {custom.cta.label}
            </Link>
          </div>
        </div>

        {/* ── Right: Image ── */}
        <div className="relative order-1 lg:order-2 aspect-[4/3] lg:aspect-auto min-h-[300px]">
          <Image
            src={custom.image}
            alt="Custom Odessi tee personalization"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center opacity-70 select-none"
          />
          {/* Left edge fade */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-32 hidden lg:block"
            style={{
              background: "linear-gradient(to right, var(--color-odessi-black), transparent)",
            }}
          />
          {/* Bottom overlay for mobile */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-20 lg:hidden"
            style={{
              background: "linear-gradient(to top, var(--color-odessi-black), transparent)",
            }}
          />

          {/* Floating label */}
          <div className="absolute top-6 right-6 border border-white/20 bg-black/40 backdrop-blur-sm px-4 py-3">
            <p className="type-caption text-white">PRINT ON DEMAND</p>
          </div>
        </div>
      </div>
    </section>
  );
}
