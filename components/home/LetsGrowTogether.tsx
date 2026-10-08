"use client";

import Link from "next/link";
import { ArrowRight, Building2, Store, Users, Sparkles } from "lucide-react";

export function LetsGrowTogether() {
  return (
    <section className="my-16 py-16 px-6 sm:px-12 bg-[#080808] border border-white/[0.08] relative overflow-hidden">
      {/* Subtle architectural ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#171717] border border-[#b89a5a]/30 text-[#b89a5a] text-[10px] font-mono font-medium uppercase tracking-[0.2em]">
          <Building2 className="w-3.5 h-3.5" />
          Partner Network
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal uppercase tracking-tight text-[#f3f0e8]">
          LET&apos;S GROW TOGETHER
        </h2>

        <p className="text-sm sm:text-base text-[#9c978e] font-light max-w-xl mx-auto leading-relaxed">
          Bring Odessi.tfi to your store, boutique, or curated retail space.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-mono uppercase tracking-widest text-[#d4d0c7] py-2">
          <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5 text-[#b89a5a]" /> Wholesale</span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-[#b89a5a]" /> Retail Partnerships</span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#b89a5a]" /> Bulk Orders</span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#b89a5a]" /> Custom Collections</span>
        </div>

        <div className="pt-4">
          <Link
            href="/partner"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#f3f0e8] hover:bg-[#b89a5a] text-[#080808] text-[11px] font-mono font-semibold uppercase tracking-[0.2em] transition-all duration-300"
          >
            BECOME A PARTNER <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
