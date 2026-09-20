import type { Metadata } from "next";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { RotateCcw, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Returns & Exchanges | ODESSI.TFI",
  description: "Find out how to return or exchange your Odessi.tfi apparel. 7-day returns, 14-day size exchanges, and hassle-free refunds.",
};

export default function ReturnsPage() {
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
              CLIENT CARE & SATISFACTION
            </p>
            <h1 className="type-h1 text-[var(--color-odessi-black)] mb-4 font-serif">
              RETURNS & EXCHANGES
            </h1>
            <p className="text-xs font-mono text-[var(--color-odessi-stone)] uppercase tracking-wider mb-6">
              7-Day Returns • 14-Day Size Exchanges • Easy Reverse Pickups
            </p>
            <div className="h-px bg-[var(--color-odessi-smoke)]" />
          </div>

          {/* Content */}
          <div className="space-y-10 text-[var(--color-odessi-mid)] type-body leading-relaxed">
            {/* Overview / Highlight Cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-6 bg-white border border-[var(--color-odessi-smoke)] rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-[var(--color-odessi-black)] font-semibold text-sm">
                  <RotateCcw size={18} />
                  <span>7-Day Return Window</span>
                </div>
                <p className="text-xs text-[var(--color-odessi-stone)] leading-relaxed">
                  Return any standard apparel within 7 calendar days of delivery for a full refund back to your original payment method.
                </p>
              </div>

              <div className="p-6 bg-white border border-[var(--color-odessi-smoke)] rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-[var(--color-odessi-black)] font-semibold text-sm">
                  <RefreshCw size={18} />
                  <span>14-Day Size Exchange</span>
                </div>
                <p className="text-xs text-[var(--color-odessi-stone)] leading-relaxed">
                  Need a different silhouette or size? Swap sizes within 14 calendar days of delivery with free reverse pickup.
                </p>
              </div>
            </div>

            {/* Eligibility Requirements */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[var(--color-odessi-black)]" />
                1. Return & Exchange Eligibility
              </h2>
              <p>
                To qualify for a refund or replacement exchange, all items must meet the following strict conditions upon arrival at our warehouse:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong className="text-[var(--color-odessi-black)]">Condition:</strong> The garment must be completely unworn, unwashed, unaltered, and free of stains, deodorant marks, perfume scents, or pet hair.
                </li>
                <li>
                  <strong className="text-[var(--color-odessi-black)]">Original Tags & Packaging:</strong> All woven neck tags, hangtags, barcodes, and custom branded dust bags must remain intact and attached.
                </li>
                <li>
                  <strong className="text-[var(--color-odessi-black)]">Proof of Purchase:</strong> Your order number (#ODS-XXXXX) or purchase confirmation email must accompany the return request.
                </li>
              </ul>
            </section>

            {/* Non-returnable Items */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase flex items-center gap-2">
                <AlertCircle size={18} className="text-[var(--color-odessi-black)]" />
                2. Non-Returnable & Final Sale Items
              </h2>
              <div className="p-4 bg-[var(--color-odessi-smoke)]/60 rounded-sm text-sm space-y-2">
                <p>
                  The following items cannot be returned or refunded:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-[var(--color-odessi-stone)]">
                  <li>
                    <strong className="text-[var(--color-odessi-black)]">Custom / Personalized Orders:</strong> Any bespoke items, college fests, bulk organizational orders, or personalized prints made to custom order specifications.
                  </li>
                  <li>
                    <strong className="text-[var(--color-odessi-black)]">Worn or Washed Apparel:</strong> Garments that have been laundered, altered, or worn beyond initial sizing trial.
                  </li>
                  <li>
                    <strong className="text-[var(--color-odessi-black)]">Items marked &ldquo;Final Sale&rdquo;</strong> or promotional clearance pieces explicitly designated as non-returnable.
                  </li>
                </ul>
              </div>
            </section>

            {/* How to Initiate */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                3. How to Initiate a Return or Exchange
              </h2>
              <p>
                Initiating a return or size exchange takes less than two minutes:
              </p>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-white border border-[var(--color-odessi-smoke)] rounded-sm space-y-1">
                  <p className="font-semibold text-[var(--color-odessi-black)]">
                    Step 1: Email Us
                  </p>
                  <p className="text-xs text-[var(--color-odessi-stone)]">
                    Send an email to <a href="mailto:hello@odessi.shop" className="text-[var(--color-odessi-black)] font-mono underline hover:text-[var(--color-odessi-gold)]">hello@odessi.shop</a> with the subject line <code>Return / Exchange - #ODS-XXXXX</code>. Include your order number, reason for return/exchange, and photos of the item showcasing tags intact.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[var(--color-odessi-smoke)] rounded-sm space-y-1">
                  <p className="font-semibold text-[var(--color-odessi-black)]">
                    Step 2: Pickup Arranged
                  </p>
                  <p className="text-xs text-[var(--color-odessi-stone)]">
                    Our team will verify your request within 24 hours and schedule a reverse courier pickup from your doorstep. A representative will contact you with pickup details.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[var(--color-odessi-smoke)] rounded-sm space-y-1">
                  <p className="font-semibold text-[var(--color-odessi-black)]">
                    Step 3: Secure Handover
                  </p>
                  <p className="text-xs text-[var(--color-odessi-stone)]">
                    Pack the unworn item securely in its original packaging along with all tags. Hand over the package to the courier partner upon verification.
                  </p>
                </div>
              </div>
            </section>

            {/* Refund Timeline */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                4. Quality Inspection & Refund Timeline
              </h2>
              <p>
                Once your returned package arrives back at our Hyderabad logistics hub, our quality inspection team inspects the garment within <strong>48 hours</strong>.
              </p>
              <p className="text-sm">
                Upon successful verification:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong className="text-[var(--color-odessi-black)]">Refund Process:</strong> The refund will be credited back to your original mode of payment (UPI, Credit/Debit Card, NetBanking via Razorpay) within <strong>5–7 business days</strong>.
                </li>
                <li>
                  <strong className="text-[var(--color-odessi-black)]">Size Exchange Dispatch:</strong> For exchange requests, the replacement size is dispatched immediately after quality approval, and tracking details are emailed to you.
                </li>
              </ul>
            </section>

            {/* Still Need Help */}
            <section className="space-y-4 pt-6 border-t border-[var(--color-odessi-smoke)]">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                5. Need Immediate Assistance?
              </h2>
              <p className="text-sm">
                Have questions about fit, sizing, or a return in transit? Our support desk is ready to assist:
              </p>
              <div className="p-4 bg-white border border-[var(--color-odessi-smoke)] rounded-sm text-sm space-y-1">
                <p><strong className="text-[var(--color-odessi-black)]">ODESSI Returns Desk</strong></p>
                <p>Email: <a href="mailto:hello@odessi.shop" className="text-[var(--color-odessi-black)] font-mono underline hover:text-[var(--color-odessi-gold)]">hello@odessi.shop</a></p>
                <p className="text-xs text-[var(--color-odessi-stone)] pt-1">
                  Average response turnaround: Under 12 hours.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
