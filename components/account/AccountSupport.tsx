"use client";

import React from "react";
import Link from "next/link";
import { Mail, HelpCircle, Truck, RotateCcw, Ruler, ArrowRight, ShieldCheck } from "lucide-react";
import IconInstagram from "@/components/ui/IconInstagram";

export default function AccountSupport() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-widest mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Concierge & Assistance
        </div>
        <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          Customer Support
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Need help with an order, sizing guidance, or collection drop details? Get in touch with our team.
        </p>
      </div>

      {/* Official Communication Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="mailto:hello@odessi.shop"
          className="p-5 bg-stone-900 text-white rounded-xl border border-stone-800 hover:border-amber-400/50 transition-all flex items-start gap-4 group"
        >
          <div className="p-3 bg-stone-800 rounded-lg text-amber-400 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block">
              Official Email
            </span>
            <span className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
              hello@odessi.shop
            </span>
            <p className="text-xs text-stone-400 mt-1">Order assistance & inquiries</p>
          </div>
        </a>

        <a
          href="https://instagram.com/odessi.tfi"
          target="_blank"
          rel="noopener noreferrer"
          className="p-5 bg-stone-900 text-white rounded-xl border border-stone-800 hover:border-amber-400/50 transition-all flex items-start gap-4 group"
        >
          <div className="p-3 bg-stone-800 rounded-lg text-amber-400 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
            <IconInstagram size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block">
              Instagram Official
            </span>
            <span className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
              @odessi.tfi
            </span>
            <p className="text-xs text-stone-400 mt-1">Drop teasers & updates</p>
          </div>
        </a>
      </div>

      {/* Help Directories */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-xs">
        <h3 className="text-xs uppercase font-mono tracking-widest font-bold text-stone-700">
          Dedicated Help Directory
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/contact"
            className="flex items-center justify-between p-3.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-700" />
              <span>Contact Page</span>
            </span>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </Link>

          <Link
            href="/faqs"
            className="flex items-center justify-between p-3.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>Frequently Asked Questions</span>
            </span>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </Link>

          <Link
            href="/shipping"
            className="flex items-center justify-between p-3.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-700" />
              <span>Shipping Policy</span>
            </span>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </Link>

          <Link
            href="/returns"
            className="flex items-center justify-between p-3.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-800 transition-colors"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>Returns & Exchanges</span>
            </span>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </Link>

          <Link
            href="/size-guide"
            className="flex items-center justify-between p-3.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-800 sm:col-span-2 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-amber-700" />
              <span>Sizing & Fit Guide</span>
            </span>
            <ArrowRight className="w-4 h-4 text-stone-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
