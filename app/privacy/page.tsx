import type { Metadata } from "next";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | ODESSI.TFI",
  description: "Learn how Odessi.tfi collects, protects, and handles your personal information in accordance with Indian IT laws and global data privacy standards.",
};

export default function PrivacyPage() {
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
              LEGAL & PRIVACY
            </p>
            <h1 className="type-h1 text-[var(--color-odessi-black)] mb-4 font-serif">
              PRIVACY POLICY
            </h1>
            <p className="text-xs font-mono text-[var(--color-odessi-stone)] uppercase tracking-wider mb-6">
              Last Updated: September 2026
            </p>
            <div className="h-px bg-[var(--color-odessi-smoke)]" />
          </div>

          {/* Content */}
          <div className="space-y-10 text-[var(--color-odessi-mid)] type-body leading-relaxed">
            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                1. Overview & Commitment
              </h2>
              <p>
                At ODESSI.TFI (&ldquo;ODESSI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy details the types of personal data we collect through our website (<Link href="/" className="text-[var(--color-odessi-black)] underline hover:text-[var(--color-odessi-gold)]">odessi.shop</Link>), how we use, safeguard, and disclose that data, and your rights under the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 of India, and applicable international data protection standards.
              </p>
            </section>

            {/* Information Collected */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                2. Information We Collect
              </h2>
              <p>
                When you browse our storefront, create an account, purchase apparel, or reach out to our team, we collect the following categories of information:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong className="text-[var(--color-odessi-black)]">Identity & Contact Details:</strong> Full name, email address, phone number, shipping address, and billing address.
                </li>
                <li>
                  <strong className="text-[var(--color-odessi-black)]">Account Credentials:</strong> Password hash, encrypted session tokens, and communication preferences.
                </li>
                <li>
                  <strong className="text-[var(--color-odessi-black)]">Order & Transaction Details:</strong> Products purchased, sizes, quantities, transaction timestamps, order values, and delivery status.
                </li>
                <li>
                  <strong className="text-[var(--color-odessi-black)]">Payment Information:</strong> All payment processing is conducted through our compliant third-party payment partner, Razorpay. ODESSI does not store your full card numbers, CVVs, or UPI MPINs on our servers.
                </li>
                <li>
                  <strong className="text-[var(--color-odessi-black)]">Technical & Usage Data:</strong> IP address, device type, browser specifications, operating system, pages visited, and referring URLs collected via standard server logs and telemetry.
                </li>
              </ul>
            </section>

            {/* How Data is Used */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                3. How We Use Your Data
              </h2>
              <p>
                We use the data collected strictly for legitimate business operations and fulfilling our contractual commitments to you:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Processing, packing, and delivering your apparel orders.</li>
                <li>Sending transactional updates, such as order confirmations, invoices, and shipment tracking links.</li>
                <li>Handling customer inquiries, size exchange requests, and refunds.</li>
                <li>Maintaining the security, performance, and integrity of our application.</li>
                <li>
                  Delivering product drop alerts, new collection announcements, and editorial newsletters—only when you have explicitly opted in. You can opt out at any time.
                </li>
              </ul>
            </section>

            {/* Third Parties & Payment Partners */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                4. Third Parties & Service Providers
              </h2>
              <p>
                We do not sell, rent, or trade your personal data to third parties. We share only strictly necessary information with trusted third-party providers:
              </p>
              <div className="space-y-3 text-sm">
                <div className="p-4 bg-[var(--color-odessi-smoke)]/60 rounded-sm">
                  <p className="font-semibold text-[var(--color-odessi-black)] mb-1">
                    Razorpay Payment Gateway
                  </p>
                  <p>
                    All electronic payment transactions are processed securely via Razorpay Software Private Limited adhering to PCI-DSS Level 1 compliance standards.
                  </p>
                </div>
                <div className="p-4 bg-[var(--color-odessi-smoke)]/60 rounded-sm">
                  <p className="font-semibold text-[var(--color-odessi-black)] mb-1">
                    Logistics & Shipping Partners
                  </p>
                  <p>
                    Your name, shipping address, and contact number are securely transmitted to our logistics partners (e.g., Blue Dart, Delhivery, DTDC) solely to fulfill your package delivery.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies & Analytics */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                5. Cookies & Analytics
              </h2>
              <p>
                We utilize essential cookies to maintain your shopping cart, preserve authentication sessions, and remember user preferences. We may also use anonymous analytics tokens to measure site performance, page load times, and customer journeys to refine the Odessi experience. You can adjust cookie preferences in your browser settings, though certain functions (such as cart persistence) may be affected.
              </p>
            </section>

            {/* Data Retention */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                6. Data Retention Policy
              </h2>
              <p>
                We retain personal information for the period necessary to fulfill the purposes outlined in this policy, unless a longer retention period is mandated or permitted by law (such as tax compliance, accounting audits, and statutory reporting under Indian commercial statutes). Once the retention duration concludes, data is securely sanitized or anonymized.
              </p>
            </section>

            {/* User Rights */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                7. Your Rights & Choices
              </h2>
              <p>
                Subject to applicable statutory provisions, you retain the right to:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Request access to the personal data we store regarding your account.</li>
                <li>Request correction or rectification of any inaccurate or incomplete details.</li>
                <li>Request deletion of your account and associated personal data.</li>
                <li>Opt out of marketing communications via the unsubscribe link in our emails or by contacting us.</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section className="space-y-4 pt-6 border-t border-[var(--color-odessi-smoke)]">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                8. Contact & Grievance Officer
              </h2>
              <p>
                For privacy-related inquiries, data requests, or grievances under the Information Technology Act, please contact our support team:
              </p>
              <div className="p-4 bg-white border border-[var(--color-odessi-smoke)] rounded-sm text-sm space-y-1">
                <p><strong className="text-[var(--color-odessi-black)]">ODESSI.TFI Support</strong></p>
                <p>Email: <a href="mailto:hello@odessi.shop" className="text-[var(--color-odessi-black)] font-mono underline hover:text-[var(--color-odessi-gold)]">hello@odessi.shop</a></p>
                <p>Location: Hyderabad, Telangana, India</p>
                <p className="text-xs text-[var(--color-odessi-stone)] pt-1">
                  We respond to all verified inquiries within 48 business hours.
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
