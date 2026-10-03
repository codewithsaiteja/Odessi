"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getHomepageContent, HomepageSection } from "@/lib/api/content";
import { getMediaUrl } from "@/lib/product-utils";

interface AuthShellProps {
  children: React.ReactNode;
}

const DEFAULT_AUTH_FALLBACK = "/placeholder-auth.svg";

export default function AuthShell({ children }: AuthShellProps) {
  const [authContent, setAuthContent] = useState<HomepageSection | null>(null);

  useEffect(() => {
    let isMounted = true;
    getHomepageContent()
      .then((sections) => {
        if (!isMounted) return;
        const found = sections.find((s) => s.sectionKey === "AUTH_PAGE" && s.active);
        if (found) {
          setAuthContent(found);
        }
      })
      .catch(() => {
        // Fall back gracefully to brand placeholder
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const rawDesktop = authContent?.mediaUrl;
  const rawMobile = authContent?.mobileMediaUrl;

  const desktopImage = rawDesktop
    ? getMediaUrl(rawDesktop, DEFAULT_AUTH_FALLBACK)
    : DEFAULT_AUTH_FALLBACK;

  const mobileImage = rawMobile
    ? getMediaUrl(rawMobile, desktopImage)
    : desktopImage;

  return (
    <div className="min-h-screen w-full bg-[#080808] text-[#F3F0E8] flex flex-col lg:flex-row overflow-x-hidden selection:bg-[#F3F0E8] selection:text-[#080808]">
      {/* ── Desktop Left Editorial Panel (50% Width) ── */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-[#080808] flex-col justify-between p-12 xl:p-16 select-none overflow-hidden border-r border-[#171717]">
        {/* Full-bleed Editorial Campaign Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={desktopImage}
            alt="Odessi Editorial"
            fill
            priority
            quality={92}
            sizes="50vw"
            className="object-cover object-center select-none"
          />
          {/* Subtle Dark Editorial Vignette */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-[#080808]/20 z-10"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#080808]/60 z-10"
          />
        </div>

        {/* Top Header — Small Refined Logo */}
        <div className="relative z-20 flex items-center justify-between">
          <Link href="/" aria-label="Odessi Home" className="inline-block group">
            <Image
              src="/logo2.png"
              alt="Odessi"
              width={130}
              height={32}
              priority
              className="h-7 w-auto object-contain brightness-95 contrast-125 transition-opacity duration-300 group-hover:opacity-75"
            />
          </Link>
          <span className="text-[10px] tracking-[0.3em] text-[#9C978E] uppercase font-mono">
            ATELIER
          </span>
        </div>

        {/* Bottom Subtle Editorial Footer */}
        <div className="relative z-20 flex items-center justify-between border-t border-white/10 pt-6 text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono">
          <span>PRIVATE ACCESS</span>
          <span>EST. 2026</span>
        </div>
      </div>

      {/* ── Right Authentication Panel (50% Desktop, 100% Mobile) ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-18 bg-[#080808] relative">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#9C978E] hover:text-[#FAF9F6] transition-colors font-mono group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Return to Store</span>
          </Link>

          {/* Mobile Logo on Small Screens */}
          <div className="lg:hidden">
            <Link href="/" aria-label="Odessi Home">
              <Image
                src="/logo2.png"
                alt="Odessi"
                width={110}
                height={26}
                priority
                className="h-6 w-auto object-contain brightness-95 contrast-125"
              />
            </Link>
          </div>
        </div>

        {/* Mobile Header Banner (<1024px) */}
        <div className="lg:hidden mb-8 w-full h-40 sm:h-48 relative overflow-hidden rounded-[2px] border border-[#1C1C1C] bg-[#111111]">
          <Image
            src={mobileImage}
            alt="Odessi Campaign"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-center opacity-45"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#080808] via-black/40 to-transparent"
          />
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] tracking-[0.25em] text-[#9C978E] uppercase font-mono z-10">
            <span>ODISSI</span>
            <span>PRIVATE ACCESS</span>
          </div>
        </div>

        {/* Form Negative Space Container (No Boxed Card) */}
        <div className="w-full max-w-md mx-auto my-auto py-4 sm:py-6">
          {children}
        </div>

        {/* Understated Minimalist Footer */}
        <div className="mt-12 text-center text-[10px] text-[#555555] tracking-[0.25em] uppercase font-mono">
          © {new Date().getFullYear()} ODESSI. ALL RIGHTS RESERVED.
        </div>
      </div>
    </div>
  );
}
