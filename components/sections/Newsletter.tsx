"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Copy, Check, Loader2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import { subscribeToNewsletter, NewsletterResponse } from "@/lib/api/newsletter";

export default function Newsletter() {
  const { newsletter } = siteConfig;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<NewsletterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);

  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const showError = touched && email.length > 0 && !isValidEmail(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValidEmail(email)) return;

    setLoading(true);
    setError(null);

    try {
      const res = await subscribeToNewsletter(email.trim());
      setResponse(res);
    } catch (err: any) {
      setError(err?.message || "Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCoupon = () => {
    if (response?.couponCode) {
      navigator.clipboard.writeText(response.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="section-py bg-[var(--color-odessi-black)]"
    >
      <div className="container-odessi">
        <div className="max-w-2xl mx-auto text-center">
          {/* Eyebrow */}
          <p className="type-caption text-[var(--color-odessi-stone)] mb-4">
            {newsletter.eyebrow}
          </p>

          <span
            className="divider bg-[var(--color-odessi-graphite)] mx-auto block mb-6"
            aria-hidden="true"
          />

          {/* Headline */}
          <h2
            id="newsletter-heading"
            className="text-white mb-5"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2rem, 4vw, 4rem)",
              fontWeight: 300,
              lineHeight: 0.98,
              letterSpacing: "-0.01em",
            }}
          >
            {newsletter.headline.split("\n").map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h2>

          {/* Body */}
          <p className="type-body text-[var(--color-odessi-silver)] mb-10 max-w-md mx-auto">
            {newsletter.body}
          </p>

          {/* Form / Success Feedback */}
          {response ? (
            <div className="border border-[var(--color-odessi-graphite)] bg-white/5 p-8 max-w-md mx-auto rounded-sm backdrop-blur-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-center gap-2 mb-2 text-emerald-400">
                <CheckCircle2 size={20} />
                <p className="type-h3 text-white">You&apos;re on the list.</p>
              </div>
              <p className="type-body-sm text-[var(--color-odessi-silver)] mb-6">
                {response.message}
              </p>

              {/* Welcome Voucher Code Box */}
              {response.couponCode && (
                <div className="p-4 bg-black/60 border border-white/10 rounded-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-mono tracking-widest uppercase text-[var(--color-odessi-stone)]">
                      YOUR EXCLUSIVE VOUCHER
                    </p>
                    <p className="font-mono text-base font-bold text-[#b89a5a] tracking-wider">
                      {response.couponCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyCoupon}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-mono uppercase tracking-wider transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? "COPIED" : "COPY"}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="Newsletter signup"
              className="max-w-md mx-auto"
            >
              <div className="flex flex-col sm:flex-row gap-0 border border-[var(--color-odessi-graphite)] focus-within:border-[var(--color-odessi-stone)] transition-colors">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={newsletter.placeholder}
                  required
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={showError}
                  aria-describedby={showError ? "email-error" : undefined}
                  className="
                    flex-1 bg-transparent px-5 py-4 type-body text-white
                    placeholder:text-[var(--color-odessi-mid)]
                    outline-none min-w-0
                  "
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    btn-primary border-l border-[var(--color-odessi-graphite)] border-t-0 border-r-0 border-b-0
                    sm:border-t-0 sm:border-r-0 sm:border-b-0 sm:border-l
                    px-6 py-4 shrink-0
                    flex items-center justify-center gap-2
                    disabled:opacity-60
                  "
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>{newsletter.cta}</span>
                      <ArrowRight size={13} strokeWidth={2} />
                    </>
                  )}
                </button>
              </div>

              {/* Validation or API error */}
              {(showError || error) && (
                <p
                  id="email-error"
                  role="alert"
                  className="type-caption text-[var(--color-odessi-accent)] mt-2 text-left"
                >
                  {error || "Please enter a valid email address."}
                </p>
              )}
            </form>
          )}

          {/* Fine print */}
          <p className="type-caption text-[var(--color-odessi-mid)] mt-5">
            No spam. Unsubscribe any time.
          </p>
        </div>
      </div>
    </section>
  );
}
