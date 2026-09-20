import type { Metadata } from "next";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Truck, ShieldCheck, Clock, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping Policy | ODESSI.TFI",
  description: "Learn about Odessi.tfi shipping options, delivery times across India, free shipping thresholds, and order tracking.",
};

export default function ShippingPage() {
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
              FULFILLMENT & DISPATCH
            </p>
            <h1 className="type-h1 text-[var(--color-odessi-black)] mb-4 font-serif">
              SHIPPING POLICY
            </h1>
            <p className="text-xs font-mono text-[var(--color-odessi-stone)] uppercase tracking-wider mb-6">
              All Orders Dispatched from Hyderabad, India
            </p>
            <div className="h-px bg-[var(--color-odessi-smoke)]" />
          </div>

          {/* Content */}
          <div className="space-y-10 text-[var(--color-odessi-mid)] type-body leading-relaxed">
            {/* Intro */}
            <section className="space-y-4">
              <p>
                At ODESSI.TFI, every garment is inspected by hand, folded in premium bespoke packaging, and dispatched swiftly through our trusted national logistics network. We strive to get your pieces into your hands in pristine condition as quickly as possible.
              </p>
            </section>

            {/* Shipping Tiers Table / Cards */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                1. Shipping Rates & Delivery Estimates
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 my-4">
                {/* Standard Shipping */}
                <div className="p-6 bg-white border border-[var(--color-odessi-smoke)] rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="type-caption text-[var(--color-odessi-stone)] tracking-wider">
                      STANDARD DELIVERY
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-odessi-black)]">
                      ₹99
                    </span>
                  </div>
                  <h3 className="type-h2 text-xl font-serif text-[var(--color-odessi-black)]">
                    5–7 Business Days
                  </h3>
                  <p className="text-xs text-[var(--color-odessi-stone)] leading-relaxed">
                    Reliable surface courier across all serviceable Indian pincodes. Free on orders of ₹999 or more.
                  </p>
                  <div className="pt-2 border-t border-[var(--color-odessi-smoke)] text-xs text-[var(--color-odessi-gold)] font-medium">
                    ✓ FREE on orders above ₹999
                  </div>
                </div>

                {/* Express Shipping */}
                <div className="p-6 bg-white border border-[var(--color-odessi-black)] rounded-sm space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[var(--color-odessi-black)] text-white text-[9px] uppercase tracking-widest px-2.5 py-0.5 font-semibold">
                    EXPEDITED
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="type-caption text-[var(--color-odessi-stone)] tracking-wider">
                      EXPRESS AIR
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-odessi-black)]">
                      ₹149
                    </span>
                  </div>
                  <h3 className="type-h2 text-xl font-serif text-[var(--color-odessi-black)]">
                    2–3 Business Days
                  </h3>
                  <p className="text-xs text-[var(--color-odessi-stone)] leading-relaxed">
                    Priority air cargo available at checkout for major metro cities (Mumbai, Delhi-NCR, Bengaluru, Hyderabad, Chennai, Kolkata).
                  </p>
                  <div className="pt-2 border-t border-[var(--color-odessi-smoke)] text-xs text-[var(--color-odessi-black)] font-medium">
                    ⚡ Priority warehouse dispatch
                  </div>
                </div>
              </div>
            </section>

            {/* Processing Timeline */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase flex items-center gap-2">
                <Clock size={18} className="text-[var(--color-odessi-black)]" />
                2. Processing & Fulfillment Time
              </h2>
              <p>
                All orders are processed and packed within <strong>1–2 business days</strong> (Monday through Saturday, excluding gazetted national holidays) following successful payment confirmation.
              </p>
              <p className="text-sm">
                Orders placed after 4:00 PM IST or over the weekend will begin fulfillment processing on the subsequent business day. In the rare instance of an unforeseen warehouse surge or high-demand capsule drop, dispatch notifications will outline any minor delay.
              </p>
            </section>

            {/* Tracking */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase flex items-center gap-2">
                <Truck size={18} className="text-[var(--color-odessi-black)]" />
                3. Tracking Your Order
              </h2>
              <p>
                As soon as your package has been scanned into the courier logistics hub, you will receive an email containing your unique <strong>Air Waybill (AWB) number</strong> and a live tracking link.
              </p>
              <p className="text-sm">
                You can also check the real-time shipping status of all historical and active shipments under your <Link href="/account?tab=orders" className="text-[var(--color-odessi-black)] underline hover:text-[var(--color-odessi-gold)]">Account Orders</Link> dashboard. Please allow up to 12 hours from dispatch for courier telemetry to register on tracking portals.
              </p>
            </section>

            {/* Coverage & Remote Areas */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase flex items-center gap-2">
                <MapPin size={18} className="text-[var(--color-odessi-black)]" />
                4. Domestic Shipping Coverage & Remote Areas
              </h2>
              <p>
                We currently ship <strong>across India only</strong>. We service over 19,000+ PIN codes across all 28 states and 8 union territories via top-tier courier networks including Blue Dart, Delhivery, and DTDC.
              </p>
              <div className="p-4 bg-[var(--color-odessi-smoke)]/60 rounded-sm text-sm space-y-1.5">
                <p className="font-semibold text-[var(--color-odessi-black)]">
                  Note on Remote & Extended Delivery Locations
                </p>
                <p className="text-[var(--color-odessi-stone)]">
                  Deliveries to remote locations, hill stations, North-Eastern states (Assam, Meghalaya, Arunachal Pradesh, Mizoram, Manipur, Nagaland, Tripura), Jammu & Kashmir, and island territories (Andaman & Nicobar, Lakshadweep) may require an additional <strong>2–4 business days</strong> beyond standard estimates due to regional transit constraints.
                </p>
              </div>
            </section>

            {/* Delivery Attempts & Packaging */}
            <section className="space-y-4">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase flex items-center gap-2">
                <ShieldCheck size={18} className="text-[var(--color-odessi-black)]" />
                5. Delivery Attempts & Safe Reception
              </h2>
              <p>
                Our courier partners will make up to <strong>3 delivery attempts</strong> to the shipping address supplied during checkout before routing the consignment back to our fulfillment center. An SMS or WhatsApp alert with a delivery OTP will often precede the final delivery.
              </p>
              <p className="text-sm">
                <strong>Package Inspection:</strong> If the outer parcel appears noticeably damaged, opened, or tampered with at the time of delivery, please refuse receipt or take clear photographs prior to opening, and notify our team immediately at <a href="mailto:hello@odessi.shop" className="text-[var(--color-odessi-black)] font-mono underline hover:text-[var(--color-odessi-gold)]">hello@odessi.shop</a>.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-4 pt-6 border-t border-[var(--color-odessi-smoke)]">
              <h2 className="type-h3 text-[var(--color-odessi-black)] text-base font-semibold tracking-wider uppercase">
                6. Questions About Your Shipment?
              </h2>
              <p className="text-sm">
                Need to update a delivery address or check delayed transit? Contact our customer support team:
              </p>
              <div className="p-4 bg-white border border-[var(--color-odessi-smoke)] rounded-sm text-sm space-y-1">
                <p><strong className="text-[var(--color-odessi-black)]">ODESSI Dispatch Desk</strong></p>
                <p>Email: <a href="mailto:hello@odessi.shop" className="text-[var(--color-odessi-black)] font-mono underline hover:text-[var(--color-odessi-gold)]">hello@odessi.shop</a></p>
                <p>Working Hours: Mon–Sat, 10:00 AM – 7:00 PM IST</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
