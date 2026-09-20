import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Story | Odessi.tfi",
  description: "Odessi.tfi — Hero-inspired apparel designed for those who carry their own story.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#FAF9F6] flex flex-col font-sans">
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
      </div>
      <Navbar />

      <main className="flex-grow pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full text-center">
        <div className="space-y-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9C978E]">
            OUR STORY
          </p>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-[#FAF9F6] uppercase leading-none">
            WEAR YOUR STORY.
          </h1>

          <div className="w-16 h-[1px] bg-[#B89A5A] mx-auto opacity-60" />

          <div className="space-y-6 text-base sm:text-lg text-[#9C978E] font-light leading-relaxed max-w-2xl mx-auto text-left sm:text-center">
            <p>
              Odessi.tfi is built around a simple idea — what you wear can say something about who you are.
            </p>
            <p>
              We create hero-inspired apparel with a focus on strong silhouettes, considered details and everyday wearability.
            </p>
            <p>
              Every piece is designed to carry a character. You bring the story.
            </p>
          </div>

          <div className="pt-8">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#F3F0E8] text-[#080808] hover:bg-[#FAF9F6] text-xs font-bold uppercase tracking-[0.2em] transition-all"
            >
              DISCOVER ODESSI <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

