"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { growthApi, CustomOrderRequest } from "@/lib/api";
import { Package, Award, Sparkles, CheckCircle2, ArrowRight, Shirt, Briefcase, GraduationCap } from "lucide-react";

export default function CustomOrdersPage() {
  const [formData, setFormData] = useState<CustomOrderRequest>({
    organizationName: "",
    contactName: "",
    email: "",
    phone: "",
    orderType: "COLLEGE",
    estimatedQuantity: 50,
    message: "",
  });

  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      setSubmitted(true);
      return;
    }

    if (!formData.organizationName || !formData.contactName || !formData.email || !formData.phone || !formData.estimatedQuantity) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await growthApi.submitCustomOrder(formData);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit inquiry. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#0A0A0A] flex flex-col font-sans">
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
      </div>
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Hero */}
        <section className="text-center py-12 md:py-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B89A5A]/10 text-[#B89A5A] text-xs font-semibold uppercase tracking-widest mb-4">
            <Shirt className="w-3.5 h-3.5" />
            Custom & Bulk Orders
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-[#0A0A0A] uppercase mb-6 leading-tight">
            CUSTOM MERCHANDISE & BULK APPAREL
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 font-light leading-relaxed">
            Elevate your institution, brand, event, or team with Odessi.tfi’s heavy-grade fabrics, custom embroidery, screen prints, and premium oversized tailoring.
          </p>
        </section>

        {/* Categories Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-[#B89A5A]/10 text-[#B89A5A] rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold uppercase mb-1">College & University Merch</h3>
              <p className="text-xs text-neutral-500">Custom fest hoodies, club tees, batch merchandise, and alumni gear.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-[#B89A5A]/10 text-[#B89A5A] rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold uppercase mb-1">Corporate & Tech Apparel</h3>
              <p className="text-xs text-neutral-500">Minimalist team wearables, hackathon kits, and executive onboarding apparel.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-[#B89A5A]/10 text-[#B89A5A] rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold uppercase mb-1">Creators & Events</h3>
              <p className="text-xs text-neutral-500">Concert merchandise, creator drop capsules, and private event wear.</p>
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200 shadow-xl my-8">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-[#B89A5A] mx-auto animate-bounce" />
              <h2 className="text-2xl font-serif font-bold uppercase">Enquiry Submitted</h2>
              <p className="text-neutral-600 text-sm max-w-md mx-auto">
                Thank you for your custom order enquiry. Our production design team will review your specifications and contact you shortly with a personalized quote.
              </p>
              <div className="pt-6">
                <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0A0A] text-white rounded-full text-xs font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-colors">
                  Return to Storefront <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-serif font-bold uppercase tracking-tight text-[#0A0A0A]">
                  REQUEST A CUSTOM QUOTE
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Submit your custom specification details. Pricing and turnaround will be calculated based on design complexity and volume.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  type="text"
                  name="website_hp"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Organization / College / Brand *
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      required
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      placeholder="e.g. IIT Bombay / Acme Corp"
                      className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      required
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="e.g. Priya Patel"
                      className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      maxLength={150}
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="priya@domain.com"
                      className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      maxLength={20}
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Order Category *
                    </label>
                    <select
                      value={formData.orderType}
                      onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors"
                    >
                      <option value="COLLEGE">College / University Merchandise</option>
                      <option value="CORPORATE">Corporate Merchandise</option>
                      <option value="EVENTS">Event / Festival Apparel</option>
                      <option value="CREATOR">Creator Merchandise</option>
                      <option value="TEAM">Sports / Squad Merchandise</option>
                      <option value="BULK_APPAREL">Bulk Standard Apparel</option>
                      <option value="CUSTOM_COLLECTION">Custom Bespoke Collection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Estimated Quantity (Units) *
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={10000}
                      required
                      value={formData.estimatedQuantity}
                      onChange={(e) => setFormData({ ...formData, estimatedQuantity: parseInt(e.target.value) || 10 })}
                      className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Design Specifications / Customization Details
                  </label>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={formData.message || ""}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe apparel items (e.g. 280 GSM French Terry Hoodies, Puff Printing, Custom Neck Tags)..."
                    className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#0A0A0A] hover:bg-[#171717] text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? "Submitting Request..." : "SUBMIT CUSTOM ENQUIRY →"}
                </button>
              </form>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
