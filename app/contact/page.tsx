"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import IconInstagram from "@/components/ui/IconInstagram";
import {
  Mail,
  Send,
  CheckCircle2,
  HelpCircle,
  Truck,
  RotateCcw,
  Ruler,
  ShoppingBag,
  ArrowRight
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim() || formData.name.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.subject.trim()) {
      setError("Please enter a subject for your message.");
      return;
    }

    if (!formData.message.trim() || formData.message.length < 10) {
      setError("Please enter a message of at least 10 characters.");
      return;
    }

    setLoading(true);

    try {
      // Simulate form submission handling / direct email preparation
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Construct mailto for direct client handoff as verified email channel
      const mailSubject = encodeURIComponent(`[Contact Form] ${formData.subject}`);
      const mailBody = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || "N/A"}\nOrder Number: ${formData.orderNumber || "N/A"}\n\nMessage:\n${formData.message}`
      );
      
      // Trigger user mail client fallback seamlessly
      window.location.href = `mailto:hello@odessi.shop?subject=${mailSubject}&body=${mailBody}`;

      setSubmitted(true);
    } catch {
      setError("Unable to process contact request. Please email us directly at hello@odessi.shop");
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
        {/* Header Hero */}
        <section className="text-center py-10 md:py-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0A0A0A] text-white text-[10px] font-semibold uppercase tracking-[0.2em] mb-4">
            <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
            Customer Support & Enquiries
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-[#0A0A0A] uppercase mb-5 leading-tight">
            GET IN TOUCH
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 font-light leading-relaxed">
            Have a question about an order, size guidance, or upcoming collection drop? We are here to help.
          </p>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 my-6">
          {/* Left Column: Direct Info & Quick Help */}
          <div className="lg:col-span-5 space-y-6">
            {/* Contact Card */}
            <div className="bg-[#0A0A0A] text-white p-8 rounded-2xl shadow-lg border border-neutral-800">
              <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
                DIRECT CHANNELS
              </h2>
              <p className="text-2xl font-serif font-light mb-6 text-white">
                WEAR YOUR STORY.
              </p>

              <div className="space-y-5">
                <a
                  href="mailto:hello@odessi.shop"
                  className="flex items-center gap-4 group p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-[#D4AF37] transition-all"
                >
                  <div className="p-2.5 bg-neutral-800 text-[#D4AF37] rounded-lg group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                      Official Support Email
                    </span>
                    <span className="text-sm font-medium text-white group-hover:text-[#D4AF37] transition-colors">
                      hello@odessi.shop
                    </span>
                  </div>
                </a>

                <a
                  href="https://instagram.com/odessi.tfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-[#D4AF37] transition-all"
                >
                  <div className="p-2.5 bg-neutral-800 text-[#D4AF37] rounded-lg group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
                    <IconInstagram size={20} />
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                      Instagram Official
                    </span>
                    <span className="text-sm font-medium text-white group-hover:text-[#D4AF37] transition-colors">
                      @odessi.tfi
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-neutral-800">
                QUICK ASSISTANCE
              </h3>
              <p className="text-xs text-neutral-500">
                Looking for quick answers? Check our dedicated help sections:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link
                  href="/faqs"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F7F5F0] hover:bg-neutral-100 text-xs font-medium text-neutral-800 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
                  <span>FAQs</span>
                </Link>
                <Link
                  href="/shipping"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F7F5F0] hover:bg-neutral-100 text-xs font-medium text-neutral-800 transition-colors"
                >
                  <Truck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Shipping Policy</span>
                </Link>
                <Link
                  href="/returns"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F7F5F0] hover:bg-neutral-100 text-xs font-medium text-neutral-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-[#D4AF37]" />
                  <span>Returns & Exchanges</span>
                </Link>
                <Link
                  href="/size-guide"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F7F5F0] hover:bg-neutral-100 text-xs font-medium text-neutral-800 transition-colors"
                >
                  <Ruler className="w-4 h-4 text-[#D4AF37]" />
                  <span>Size Guide</span>
                </Link>
              </div>
              <div className="pt-2 border-t border-neutral-100">
                <Link
                  href="/orders"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0A0A0A] text-white hover:bg-neutral-800 text-xs font-semibold tracking-wider uppercase transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
                    Track My Orders
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-8 sm:p-10 border border-neutral-200 shadow-sm">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-[#D4AF37] mx-auto animate-bounce" />
                <h2 className="text-2xl font-serif font-bold uppercase text-[#0A0A0A]">
                  MESSAGE PREPARED
                </h2>
                <p className="text-neutral-600 text-sm max-w-md mx-auto leading-relaxed">
                  Your inquiry details have been formatted and directed to <strong className="text-black">hello@odessi.shop</strong> via your default email application.
                </p>
                <p className="text-xs text-neutral-400">
                  If your email app did not open automatically, please send your email directly to <strong>hello@odessi.shop</strong>.
                </p>
                <div className="pt-6">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", phone: "", orderNumber: "", subject: "", message: "" });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold tracking-wider uppercase hover:bg-neutral-800 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-serif font-bold uppercase tracking-tight text-[#0A0A0A]">
                    SEND US A MESSAGE
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Fill in the form below and we will respond via email.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        maxLength={80}
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Sai Teja"
                        className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        maxLength={120}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. sai@example.com"
                        className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        maxLength={20}
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                        Order Number (Optional)
                      </label>
                      <input
                        type="text"
                        name="orderNumber"
                        maxLength={50}
                        value={formData.orderNumber}
                        onChange={handleChange}
                        placeholder="e.g. ORD-10024"
                        className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Subject *
                    </label>
                    <input
                      type="text"
                      name="subject"
                      required
                      maxLength={120}
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="e.g. Order Status / Size Guidance"
                      className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      rows={5}
                      required
                      maxLength={1000}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we help you today?"
                      className="w-full px-4 py-3 bg-[#F7F5F0]/60 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-[#0A0A0A] hover:bg-[#171717] text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 text-[#D4AF37]" />
                    {loading ? "Preparing Message..." : "SEND ENQUIRY →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
