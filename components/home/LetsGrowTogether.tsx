"use client";

import Link from "next/link";
import { ArrowRight, Building2, Store, Users, Sparkles } from "lucide-react";

export function LetsGrowTogether() {
  return (
    <section className="my-16 py-16 px-6 sm:px-12 bg-white rounded-3xl border border-neutral-200 shadow-md relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B89A5A]/10 text-[#B89A5A] text-xs font-semibold uppercase tracking-widest">
          <Building2 className="w-3.5 h-3.5" />
          Partner Network
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold uppercase tracking-tight text-[#0A0A0A]">
          LET'S GROW TOGETHER
        </h2>

        <p className="text-base sm:text-lg text-neutral-600 font-light max-w-xl mx-auto">
          Bring Odessi.tfi to your store.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-700 py-2">
          <span className="flex items-center gap-1.5"><Store className="w-4 h-4 text-[#B89A5A]" /> Wholesale</span>
          <span className="text-neutral-300">•</span>
          <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-[#B89A5A]" /> Retail Partnerships</span>
          <span className="text-neutral-300">•</span>
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-[#B89A5A]" /> Bulk Orders</span>
          <span className="text-neutral-300">•</span>
          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#B89A5A]" /> Custom Collections</span>
        </div>

        <div className="pt-4">
          <Link
            href="/partner"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#0A0A0A] hover:bg-[#171717] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            BECOME A PARTNER <ArrowRight className="w-4 h-4 text-[#B89A5A]" />
          </Link>
        </div>
      </div>
    </section>
  );
}
