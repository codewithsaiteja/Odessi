import type { Metadata } from "next";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | ODESSI.TFI",
  description: "Get answers to frequently asked questions regarding Odessi.tfi orders, payments, shipping, returns, sizing, and custom merchandise.",
};

export default function FAQsPage() {
  const faqs = [
    {
      question: "How do I place an order on ODESSI.TFI?",
      answer: (
        <>
          Browsing and ordering on ODESSI is straightforward. Select your desired piece from our{" "}
          <Link href="/shop" className="text-[var(--color-odessi-black)] underline hover:text-[var(--color-odessi-gold)]">
            Shop catalog
          </Link>
          , choose your size and preferred colorway, and click <strong>&ldquo;Add to Cart&rdquo;</strong>. Once you have finalized your selections, head to the checkout page, enter your delivery address, and complete payment securely via our payment gateway. You will receive an instant order confirmation email with your order summary.
        </>
      ),
    },
    {
      question: "What payment methods do you accept?",
      answer: (
        <>
          All digital payments on ODESSI.TFI are powered securely by <strong>Razorpay</strong>. We support:
          <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
            <li><strong>UPI:</strong> Google Pay, PhonePe, Paytm, BHIM, and bank UPI apps.</li>
            <li><strong>Credit & Debit Cards:</strong> Visa, MasterCard, RuPay, and American Express.</li>
            <li><strong>Net Banking:</strong> Over 50+ Indian banks including HDFC, ICICI, SBI, Axis, and Kotak.</li>
            <li><strong>Digital Wallets:</strong> Paytm Wallet, PhonePe, and Mobikwik.</li>
          </ul>
        </>
      ),
    },
    {
      question: "How can I track my shipment?",
      answer: (
        <>
          Once your package is packed and handed over to our courier partner (typically within 1–2 business days), we will email you an Air Waybill (AWB) tracking number with a live tracking link. You can also view real-time delivery milestones anytime under{" "}
          <Link href="/account?tab=orders" className="text-[var(--color-odessi-black)] underline hover:text-[var(--color-odessi-gold)]">
            Account &gt; Orders
          </Link>
          .
        </>
      ),
    },
    {
      question: "What is your return and size exchange policy?",
      answer: (
        <>
          We offer a <strong>7-day return window</strong> for a full refund and a <strong>14-day exchange window</strong> for size swaps from the date of delivery. Items must be unworn, unwashed, and returned in their original packaging with all hangtags intact. To initiate a return, simply email{" "}
          <a href="mailto:hello@odessi.shop" className="text-[var(--color-odessi-black)] font-mono underline hover:text-[var(--color-odessi-gold)]">
            hello@odessi.shop
          </a>{" "}
          with your Order ID. For full guidelines, check our{" "}
          <Link href="/returns" className="text-[var(--color-odessi-black)] underline hover:text-[var(--color-odessi-gold)]">
            Returns & Exchanges Policy
          </Link>
          .
        </>
      ),
    },
    {
      question: "How do I determine the right size for an oversized look?",
      answer: (
        <>
          All ODESSI garments are designed with an authentic streetwear cut—featuring dropped shoulders and a boxy torso drape. <strong>We recommend purchasing your usual size</strong> to achieve our signature oversized silhouette. If you prefer a regular or closer fit, consider ordering one size smaller. Check our detailed measurements on the{" "}
          <Link href="/size-guide" className="text-[var(--color-odessi-black)] underline hover:text-[var(--color-odessi-gold)]">
            Size Guide
          </Link>{" "}
          page.
        </>
      ),
    },
    {
      question: "How do I wash and care for my ODESSI apparel?",
      answer: (
        <>
          To maintain heavyweight cotton density and protect graphics:
          <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
            <li>Always machine wash inside out in cold water (≤ 30°C).</li>
            <li>Use mild, bleach-free detergent with like dark colors.</li>
            <li>Hang dry naturally in shade; do not tumble dry.</li>
            <li>Iron inside out on medium heat, never placing the iron directly onto print graphics or embroidery.</li>
          </ul>
        </>
      ),
    },
    {
      question: "Do you offer custom or bulk orders for colleges, creators, and teams?",
      answer: (
        <>
          Yes! We engineer custom merchandise capsules, fest hoodies, and executive corporate tech wear with low minimum order quantities (MOQs). Visit our{" "}
          <Link href="/custom-orders" className="text-[var(--color-odessi-black)] underline hover:text-[var(--color-odessi-gold)]">
            Custom & Bulk Orders portal
          </Link>{" "}
          to submit your design specifications, volume requirements, and get a tailored quotation from our production team.
        </>
      ),
    },
    {
      question: "How can I stay updated on new drops and secret releases?",
      answer: (
        <>
          We drop limited capsule collections and character stories periodically. Follow our official Instagram handle{" "}
          <a
            href="https://instagram.com/odessi.tfi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-odessi-black)] font-semibold underline hover:text-[var(--color-odessi-gold)]"
          >
            @odessi.tfi
          </a>{" "}
          for behind-the-scenes previews, lookbooks, and early drop alerts. You can also join our email newsletter on the homepage for private access codes.
        </>
      ),
    },
    {
      question: "What should I do if my payment was deducted but the order failed?",
      answer: (
        <>
          In the rare event of a network drop during payment authorization where funds are debited but an order confirmation was not generated, the banking switch automatically initiates a reversal. Razorpay will typically refund the amount back to your source account within <strong>3–5 business days</strong>. If you need confirmation, email us at{" "}
          <a href="mailto:hello@odessi.shop" className="text-[var(--color-odessi-black)] font-mono underline hover:text-[var(--color-odessi-gold)]">
            hello@odessi.shop
          </a>{" "}
          with the Razorpay Payment ID or transaction screenshot and we will investigate right away.
        </>
      ),
    },
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
              HELP & ASSISTANCE
            </p>
            <h1 className="type-h1 text-[var(--color-odessi-black)] mb-4 font-serif">
              FREQUENTLY ASKED QUESTIONS
            </h1>
            <p className="text-xs font-mono text-[var(--color-odessi-stone)] uppercase tracking-wider mb-6">
              Everything you need to know about shopping with ODESSI.TFI
            </p>
            <div className="h-px bg-[var(--color-odessi-smoke)]" />
          </div>

          {/* Accordion FAQ list */}
          <div className="divide-y divide-[var(--color-odessi-smoke)]">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group py-5 text-left transition-colors"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none text-base sm:text-lg font-medium text-[var(--color-odessi-black)] hover:text-[var(--color-odessi-stone)] transition-colors focus-visible:outline-none">
                  <span className="pr-4">{faq.question}</span>
                  <span className="ml-2 flex-shrink-0 text-2xl font-light text-[var(--color-odessi-stone)] transition-transform duration-200 group-open:rotate-45 leading-none select-none">
                    +
                  </span>
                </summary>
                <div className="pt-4 pb-2 text-sm sm:text-base text-[var(--color-odessi-mid)] leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

          {/* Still need help callout */}
          <div className="mt-16 p-8 bg-white border border-[var(--color-odessi-smoke)] rounded-sm text-center space-y-4">
            <h2 className="type-h3 text-[var(--color-odessi-black)] text-lg">
              Still Have Questions?
            </h2>
            <p className="text-sm text-[var(--color-odessi-stone)] max-w-md mx-auto">
              Can&apos;t find what you&apos;re looking for? Reach out to our customer care team and we&apos;ll be glad to help.
            </p>
            <div className="pt-2">
              <a
                href="mailto:hello@odessi.shop"
                className="inline-block px-8 py-3.5 bg-[var(--color-odessi-black)] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[var(--color-odessi-stone)] transition-colors rounded-sm"
              >
                EMAIL HELLO@ODESSI.SHOP →
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
