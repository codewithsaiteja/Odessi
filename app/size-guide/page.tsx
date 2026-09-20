import type { Metadata } from "next";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Sparkles, Ruler, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Size Guide | ODESSI.TFI",
  description: "Find your ideal fit with the ODESSI.TFI comprehensive size chart, measurement techniques, and oversized streetwear styling guide.",
};

export default function SizeGuidePage() {
  const sizeChartData = [
    { size: "S", chest: "38–40", length: "27", shoulder: "17" },
    { size: "M", chest: "41–43", length: "28", shoulder: "18" },
    { size: "L", chest: "44–46", length: "29", shoulder: "19" },
    { size: "XL", chest: "47–49", length: "30", shoulder: "20" },
    { size: "XXL", chest: "50–52", length: "31", shoulder: "21" },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
      </div>
      <Navbar />
      <main className="pt-[calc(var(--announcement-height)+var(--navbar-height))] bg-[#FAF9F6] min-h-screen">
        <div className="container-odessi py-16 lg:py-20 max-w-3xl">
          {/* Header */}
          <div className="mb-12">
            <p className="type-caption text-[var(--color-odessi-stone)] mb-4 uppercase tracking-widest">
              FIT & MEASUREMENTS
            </p>
            <h1 className="type-h1 text-[var(--color-odessi-black)] mb-4 font-serif">
              SIZE GUIDE
            </h1>
            <p className="text-xs font-mono text-[var(--color-odessi-stone)] uppercase tracking-wider mb-6">
              Precision Measurements For Tees & Hoodies (Inches)
            </p>
            <div className="h-px bg-[var(--color-odessi-smoke)]" />
          </div>

          {/* Content */}
          <div className="space-y-12 text-[var(--color-odessi-mid)] type-body leading-relaxed">
            {/* Introduction & Silhouette */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-odessi-accent)]">
                <Sparkles size={16} />
                <span>The ODESSI Silhouette</span>
              </div>
              <p className="text-base sm:text-lg text-[var(--color-odessi-black)] font-light leading-relaxed">
                ODESSI clothing runs <strong>true to size with an intentionally oversized silhouette</strong>. Our garments feature relaxed dropped shoulders, a wider chest circumference, and a weighted drape engineered from heavy-grade cotton.
              </p>
              <div className="p-4 bg-[var(--color-odessi-smoke)]/70 border-l-2 border-[var(--color-odessi-black)] rounded-r-sm text-sm space-y-1">
                <p className="font-semibold text-[var(--color-odessi-black)]">
                  Fit Recommendation:
                </p>
                <p className="text-[var(--color-odessi-stone)]">
                  For the intended boxy streetwear drape, choose your regular size. If you are between sizes or prefer a cleaner, more tailored cut, we recommend <strong>going one size down</strong>.
                </p>
              </div>
            </section>

            {/* Size Chart Table */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                  Size Chart — Tees & Hoodies
                </h2>
                <span className="text-xs font-mono text-[var(--color-odessi-stone)] uppercase">
                  All dimensions in inches
                </span>
              </div>

              <div className="overflow-x-auto border border-[var(--color-odessi-smoke)] rounded-sm bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-odessi-smoke)] bg-[var(--color-odessi-warmwhite)]">
                      <th className="py-3.5 px-4 type-caption text-[var(--color-odessi-black)] font-bold tracking-wider">
                        Size
                      </th>
                      <th className="py-3.5 px-4 type-caption text-[var(--color-odessi-black)] font-bold tracking-wider">
                        Chest (Inches)
                      </th>
                      <th className="py-3.5 px-4 type-caption text-[var(--color-odessi-black)] font-bold tracking-wider">
                        Length (Inches)
                      </th>
                      <th className="py-3.5 px-4 type-caption text-[var(--color-odessi-black)] font-bold tracking-wider">
                        Shoulder (Inches)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-odessi-smoke)] text-sm">
                    {sizeChartData.map((row, idx) => (
                      <tr
                        key={row.size}
                        className={idx % 2 === 0 ? "bg-white" : "bg-[#FAF9F6]/60"}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[var(--color-odessi-black)]">
                          {row.size}
                        </td>
                        <td className="py-3 px-4 text-[var(--color-odessi-black)]">
                          {row.chest}&quot;
                        </td>
                        <td className="py-3 px-4 text-[var(--color-odessi-black)]">
                          {row.length}&quot;
                        </td>
                        <td className="py-3 px-4 text-[var(--color-odessi-black)]">
                          {row.shoulder}&quot;
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--color-odessi-stone)] italic">
                * Note: Garments are laid flat on a level surface. A tolerance of ±0.5 inches in manual measurements is standard across textile manufacturing.
              </p>
            </section>

            {/* How to Measure */}
            <section className="space-y-5">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase flex items-center gap-2">
                <Ruler size={18} className="text-[var(--color-odessi-black)]" />
                How to Measure Yourself
              </h2>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-white border border-[var(--color-odessi-smoke)] rounded-sm space-y-2">
                  <span className="type-caption text-[var(--color-odessi-stone)] tracking-wider">
                    1. CHEST
                  </span>
                  <p className="text-xs text-[var(--color-odessi-mid)] leading-relaxed">
                    Wrap a soft tape measure around the fullest part of your chest, keeping the tape comfortably horizontal across your shoulder blades and under armpits.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[var(--color-odessi-smoke)] rounded-sm space-y-2">
                  <span className="type-caption text-[var(--color-odessi-stone)] tracking-wider">
                    2. BODY LENGTH
                  </span>
                  <p className="text-xs text-[var(--color-odessi-mid)] leading-relaxed">
                    Measure straight down from the highest point of your shoulder seam (adjacent to the collar) to where you want the hem to rest.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[var(--color-odessi-smoke)] rounded-sm space-y-2">
                  <span className="type-caption text-[var(--color-odessi-stone)] tracking-wider">
                    3. SHOULDER WIDTH
                  </span>
                  <p className="text-xs text-[var(--color-odessi-mid)] leading-relaxed">
                    Measure horizontally across the upper back from the tip of one shoulder bone seam to the opposite shoulder seam.
                  </p>
                </div>
              </div>
            </section>

            {/* Fabric Care */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase flex items-center gap-2">
                <Info size={18} className="text-[var(--color-odessi-black)]" />
                Fabric Care & Maintenance
              </h2>
              <div className="p-5 bg-white border border-[var(--color-odessi-smoke)] rounded-sm space-y-3 text-sm">
                <p>
                  To preserve the high-density cotton structure and high-definition screen/embroidery prints:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--color-odessi-stone)]">
                  <li><strong>Machine wash cold:</strong> Always turn the garment inside out before washing at 30°C or below.</li>
                  <li><strong>Use mild detergent:</strong> Avoid bleach, harsh chemical stain removers, or fabric softeners that degrade print pigments.</li>
                  <li><strong>Line dry in shade:</strong> Avoid tumble drying; hang dry away from direct scorching sunlight to protect rich black dyes.</li>
                  <li><strong>Iron inside out:</strong> Never apply a hot iron directly onto printed graphics or high-density silicone details.</li>
                </ul>
              </div>
            </section>

            {/* Sizing Assistance */}
            <section className="space-y-4 pt-6 border-t border-[var(--color-odessi-smoke)]">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                Still Uncertain About Your Sizing?
              </h2>
              <p className="text-sm">
                Our stylists can recommend the perfect size based on your height, weight, and preferred aesthetic drape.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/shop"
                  className="px-6 py-3 bg-[var(--color-odessi-black)] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[var(--color-odessi-stone)] transition-colors rounded-sm"
                >
                  EXPLORE THE COLLECTION →
                </Link>
                <a
                  href="mailto:hello@odessi.shop?subject=Sizing%20Guidance%20Inquiry"
                  className="px-6 py-3 border border-[var(--color-odessi-black)] text-[var(--color-odessi-black)] text-xs font-semibold uppercase tracking-widest hover:bg-[var(--color-odessi-smoke)] transition-colors rounded-sm"
                >
                  GET SIZING HELP
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
