"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function Newsletter() {
  const { newsletter } = siteConfig;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [touched, setTouched] = useState(false);

  const isValidEmail = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const showError = touched && email.length > 0 && !isValidEmail(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValidEmail(email)) return;
    // ⚠️ Backend integration pending — will connect to Spring Boot API
    setStatus("success");
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

          {/* Form */}
          {status === "success" ? (
            <div className="border border-[var(--color-odessi-graphite)] px-8 py-6 max-w-md mx-auto">
              <p className="type-h3 text-white mb-1">You&apos;re in.</p>
              <p className="type-body-sm text-[var(--color-odessi-silver)]">
                Welcome to the Odessi world. Check your inbox.
              </p>
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
                  className="
                    btn-primary border-l border-[var(--color-odessi-graphite)] border-t-0 border-r-0 border-b-0
                    sm:border-t-0 sm:border-r-0 sm:border-b-0 sm:border-l
                    px-6 py-4 shrink-0
                    flex items-center gap-2
                  "
                >
                  {newsletter.cta}
                  <ArrowRight size={13} strokeWidth={2} />
                </button>
              </div>

              {/* Validation error */}
              {showError && (
                <p
                  id="email-error"
                  role="alert"
                  className="type-caption text-[var(--color-odessi-accent)] mt-2 text-left"
                >
                  Please enter a valid email address.
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
