"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { growthApi, PartnershipRequest } from "@/lib/api";
import { Building2, Store, Users, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export default function PartnerPage() {
  const [formData, setFormData] = useState<PartnershipRequest>({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    city: "",
    businessType: "RETAIL",
    message: "",
  });

  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      // Spam bot detected, silently ignore
      setSubmitted(true);
      return;
    }

    if (!formData.companyName || !formData.contactName || !formData.email || !formData.phone || !formData.city) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await growthApi.submitPartnership(formData);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit application. Please try again.";
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
        {/* Hero Section */}
        <section className="text-center py-12 md:py-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B89A5A]/10 text-[#B89A5A] text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Partnership Program
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-[#0A0A0A] uppercase mb-6 leading-tight">
            LET'S GROW TOGETHER
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 font-light leading-relaxed">
            Bring Odessi.tfi’s signature oversized silhouettes and elevated streetwear aesthetics to your boutique, store, or retail network.
          </p>
        </section>

        {/* Value Props Grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 my-12">
          <div className="bg-white/80 backdrop-blur border border-neutral-200 p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-all">
            <Store className="w-8 h-8 text-[#B89A5A] mx-auto mb-4" />
            <h3 className="font-serif text-lg font-bold uppercase mb-2">Wholesale</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">Direct inventory allocation for brick-and-mortar retailers with flexible MOQs.</p>
          </div>
          <div className="bg-white/80 backdrop-blur border border-neutral-200 p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-all">
            <Building2 className="w-8 h-8 text-[#B89A5A] mx-auto mb-4" />
            <h3 className="font-serif text-lg font-bold uppercase mb-2">Retail Partnerships</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">Pop-up installations, dedicated store bays, and exclusive regional drops.</p>
          </div>
          <div className="bg-white/80 backdrop-blur border border-neutral-200 p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-all">
            <Users className="w-8 h-8 text-[#B89A5A] mx-auto mb-4" />
            <h3 className="font-serif text-lg font-bold uppercase mb-2">Bulk Orders</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">Tiered volume pricing for large-scale enterprise or team distributions.</p>
          </div>
          <div className="bg-white/80 backdrop-blur border border-neutral-200 p-6 rounded-2xl text-center shadow-sm hover:shadow-md transition-all">
            <Sparkles className="w-8 h-8 text-[#B89A5A] mx-auto mb-4" />
            <h3 className="font-serif text-lg font-bold uppercase mb-2">Custom Collections</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">Co-branded limited capsules tailored for select retail collaborators.</p>
          </div>
        </section>

        {/* Application Form Section */}
        <section className="max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200 shadow-xl my-8">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-[#B89A5A] mx-auto animate-bounce" />
              <h2 className="text-2xl font-serif font-bold uppercase">Application Received</h2>
              <p className="text-neutral-600 text-sm max-w-md mx-auto">
                Thank you for applying to join the Odessi.tfi partner network. Our business development team will review your credentials and contact you within 48 business hours.
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
                  BECOME A PARTNER
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Fill out the details below to submit your official partnership application.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Honeypot field for bot protection */}
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
                      Company / Store Name *
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Apex Apparel Studio"
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
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      maxLength={150}
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@company.com"
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
                      City / Region *
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Partnership Type *
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors"
                    >
                      <option value="RETAIL">Retail Boutique</option>
                      <option value="WHOLESALE">Wholesale Distributor</option>
                      <option value="ONLINE">E-Commerce Platform</option>
                      <option value="CORPORATE">Corporate Partner</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Additional Information / Requirements
                  </label>
                  <textarea
                    rows={4}
                    maxLength={1000}
                    value={formData.message || ""}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your current retail presence, projected order volumes, or specific store requirements..."
                    className="w-full px-4 py-3 bg-[#F7F5F0]/50 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#B89A5A] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#0A0A0A] hover:bg-[#171717] text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? "Submitting Application..." : "BECOME A PARTNER →"}
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
