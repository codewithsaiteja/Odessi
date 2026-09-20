import type { Metadata } from "next";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | ODESSI.TFI",
  description: "Review the terms and conditions governing the purchase of apparel and use of the Odessi.tfi storefront.",
};

export default function TermsPage() {
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
              TERMS & CONDITIONS
            </p>
            <h1 className="type-h1 text-[var(--color-odessi-black)] mb-4 font-serif">
              TERMS OF SERVICE
            </h1>
            <p className="text-xs font-mono text-[var(--color-odessi-stone)] uppercase tracking-wider mb-6">
              Effective Date: September 2026
            </p>
            <div className="h-px bg-[var(--color-odessi-smoke)]" />
          </div>

          {/* Content */}
          <div className="space-y-10 text-[var(--color-odessi-mid)] type-body leading-relaxed">
            {/* Agreement */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                1. Agreement to Terms
              </h2>
              <p>
                These Terms of Service constitute a legally binding agreement between you (&ldquo;Customer&rdquo; or &ldquo;User&rdquo;) and ODESSI.TFI (&ldquo;ODESSI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By accessing, browsing, or purchasing products from our digital storefront (<Link href="/" className="text-[var(--color-odessi-black)] underline hover:text-[var(--color-odessi-gold)]">odessi.shop</Link>), you expressly agree to abide by these Terms, our Privacy Policy, and all associated guidelines. If you do not agree, you must immediately refrain from using our services.
              </p>
            </section>

            {/* Product Quality Guarantee */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                2. Product Quality Guarantee & Craftsmanship
              </h2>
              <p>
                Every garment crafted by ODESSI is engineered to strict specifications—utilizing high-density combed cotton (240+ GSM for tees) and heavy French Terry fleece (380+ GSM for hoodies), reinforced twin-needle stitching, and custom silhouettes.
              </p>
              <p>
                While we make every effort to display product cuts, textures, and colorways with exact photographic fidelity, slight variations in shade may occur due to device screen calibrations and artisanal fabric dyeing processes. Natural cotton garments may exhibit up to 2-3% shrinkage after the initial wash cycle; following our garment care guidelines ensures optimal longevity.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                3. Intellectual Property Rights
              </h2>
              <p>
                All brand identity assets, including but not limited to the names &ldquo;ODESSI&rdquo;, &ldquo;ODESSI.TFI&rdquo;, the tagline &ldquo;WEAR YOUR STORY&rdquo;, brand logos, graphic artwork, typography layouts, illustrations, product imagery, and digital designs are the exclusive intellectual property of ODESSI.TFI.
              </p>
              <p>
                No part of our website or its contents may be reproduced, reverse-engineered, duplicated, copied, sold, or distributed for commercial purposes without our prior written authorization.
              </p>
            </section>

            {/* Order Cancellation Policy */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                4. Order Placement & Cancellation Policy
              </h2>
              <p>
                Orders may be cancelled within <strong>2 hours</strong> of placement or before fulfillment processing has commenced. To cancel an order, email us at <a href="mailto:hello@odessi.shop" className="text-[var(--color-odessi-black)] font-mono underline hover:text-[var(--color-odessi-gold)]">hello@odessi.shop</a> with your Order ID.
              </p>
              <p>
                Once an order has been picked, packed, or handed over to our courier partner, it cannot be cancelled in transit. You may instead initiate a standard return once the package is delivered, subject to our <Link href="/returns" className="text-[var(--color-odessi-black)] underline hover:text-[var(--color-odessi-gold)]">Returns Policy</Link>.
              </p>
              <p>
                ODESSI reserves the right to reject or cancel any order at our discretion in the event of stock unavailability, pricing typographical errors, or suspected unauthorized transaction activity. In such events, a 100% refund is credited back immediately.
              </p>
            </section>

            {/* Payment Terms & Developer Note */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                5. Pricing & Payment Terms
              </h2>
              <p>
                All prices listed on the storefront are denominated in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST). Delivery charges, if applicable, are computed at checkout based on the delivery destination and selected shipping tier.
              </p>
              <p>
                Payments are processed through Razorpay across supported instruments: UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards (Visa, MasterCard, RuPay), Net Banking, and select digital wallets.
              </p>
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-sm text-xs text-[var(--color-odessi-black)]">
                <p className="font-semibold uppercase tracking-wider mb-1 text-[#a07840]">
                  Developer & Staging Environment Notice
                </p>
                <p className="text-[var(--color-odessi-stone)]">
                  Please note that in development and preview staging environments, the Razorpay payment gateway operates in TEST MODE. Real financial transactions are only charged in the official production deployment.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                6. Governing Law
              </h2>
              <p>
                These Terms of Service and any transactional agreements entered into with ODESSI shall be governed by, interpreted, and construed in accordance with the substantive laws of the <strong>Republic of India</strong>, without regard to conflicts of law principles.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                7. Dispute Resolution & Jurisdiction
              </h2>
              <p>
                In the event of any grievance, controversy, or dispute arising out of or related to these Terms, the parties shall first endeavor to resolve the matter through mutual good-faith negotiation by contacting <a href="mailto:hello@odessi.shop" className="text-[var(--color-odessi-black)] font-mono underline hover:text-[var(--color-odessi-gold)]">hello@odessi.shop</a>.
              </p>
              <p>
                If an amicable settlement cannot be reached within 30 days, the dispute shall be subject to the exclusive jurisdiction of the competent courts situated in <strong>Hyderabad, Telangana, India</strong>.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                8. Changes to Terms
              </h2>
              <p>
                We reserve the right to revise or update these Terms of Service at any time. Any changes will become effective immediately upon posting to this page with an updated &ldquo;Effective Date&rdquo;. Continued use of the platform after updates signifies your acceptance of the amended terms.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-4 pt-6 border-t border-[var(--color-odessi-smoke)]">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                9. Contact Information
              </h2>
              <p>
                For questions regarding these Terms or our store policies, please contact:
              </p>
              <div className="p-4 bg-white border border-[var(--color-odessi-smoke)] rounded-sm text-sm space-y-1">
                <p><strong className="text-[var(--color-odessi-black)]">ODESSI.TFI Legal & Support</strong></p>
                <p>Email: <a href="mailto:hello@odessi.shop" className="text-[var(--color-odessi-black)] font-mono underline hover:text-[var(--color-odessi-gold)]">hello@odessi.shop</a></p>
                <p>Instagram: <a href="https://instagram.com/odessi.tfi" target="_blank" rel="noopener noreferrer" className="text-[var(--color-odessi-black)] underline hover:text-[var(--color-odessi-gold)]">@odessi.tfi</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
