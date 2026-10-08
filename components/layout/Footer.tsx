import Link from "next/link";
import IconInstagram from "@/components/ui/IconInstagram";

export default function Footer() {
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || null;
  const whatsappChannelUrl =
    (process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ||
      process.env.NEXT_PUBLIC_WHATSAPP_URL)?.trim() || null;
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim() || null;

  return (
    <footer
      role="contentinfo"
      className="bg-[#080808] text-[#9c978e] border-t border-white/[0.08]"
    >
      {/* Main Container */}
      <div className="container-odessi pt-12 pb-10 sm:pt-14 sm:pb-12 lg:pt-16 lg:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12">

          {/* ZONE 1 — BRAND STATEMENT & TOUCHPOINTS (~40% desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-7">
            <div className="space-y-4">
              <Link
                href="/"
                aria-label="ODESSI.TFI Home"
                className="inline-block group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
              >
                <span className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] tracking-[0.03em] text-[#f3f0e8] font-normal leading-none block">
                  ODESSI.TFI
                </span>
              </Link>

              <div className="space-y-2">
                <p className="text-[11px] tracking-[0.2em] font-mono text-[#b89a5a] uppercase font-medium">
                  WEAR YOUR STORY.
                </p>
                <p className="text-sm text-[#9c978e] leading-relaxed max-w-sm">
                  Premium hero-inspired clothing designed for those who carry their own story.
                </p>
              </div>
            </div>

            {/* Social Icons & Clean Contact Treatment */}
            <div className="space-y-4 pt-1">
              {/* Unboxed Social Icons Row */}
              <div
                className="flex items-center gap-2 sm:gap-3 -ml-2"
                aria-label="Social and digital channels"
              >
                {/* Instagram — Always verified */}
                <a
                  href="https://instagram.com/odessi.tfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center justify-center p-2 text-[#9c978e] hover:text-[#f3f0e8] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  <IconInstagram size={20} strokeWidth={1.5} className="w-5 h-5" />
                </a>

                {/* Email — Direct Mailto */}
                <a
                  href="mailto:hello@odessi.shop"
                  aria-label="Email"
                  className="inline-flex items-center justify-center p-2 text-[#9c978e] hover:text-[#f3f0e8] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </a>

                {/* Telegram — Rendered only if configured */}
                {telegramUrl && (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Telegram"
                    className="inline-flex items-center justify-center p-2 text-[#9c978e] hover:text-[#f3f0e8] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.6 3.98-1.65 4.81-1.94 5.35-1.95.12 0 .38.03.55.17.14.12.18.28.2.46-.01.07.01.24 0 .38z" />
                    </svg>
                  </a>
                )}

                {/* WhatsApp — Rendered only if configured */}
                {whatsappChannelUrl && (
                  <a
                    href={whatsappChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="inline-flex items-center justify-center p-2 text-[#9c978e] hover:text-[#f3f0e8] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                    />
                  </svg>
                </a>
              )}

              {/* Facebook — Rendered only if configured */}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex items-center justify-center p-2 text-[#9c978e] hover:text-[#f3f0e8] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
              )}
            </div>

            {/* Clean Editorial Contact Line */}
            <div className="pt-1 flex flex-col gap-1 text-xs">
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#737373] font-medium">
                Contact
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#9c978e]">
                <a
                  href="mailto:hello@odessi.shop"
                  className="hover:text-[#f3f0e8] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  hello@odessi.shop
                </a>
                <span className="text-white/20 select-none" aria-hidden="true">
                  •
                </span>
                <a
                  href="https://instagram.com/odessi.tfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram profile @odessi.tfi"
                  className="hover:text-[#f3f0e8] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  @odessi.tfi
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Divider Between Brand Block & Navigation */}
        <div className="block lg:hidden w-full h-px bg-white/[0.08]" aria-hidden="true" />

        {/* ZONE 2 — EDITORIAL NAVIGATION (~60% desktop) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10 lg:pl-8 xl:pl-12">

          {/* SHOP COLUMN */}
          <div>
            <h3 className="text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-[#f3f0e8] mb-4">
              SHOP
            </h3>
            <ul className="flex flex-col gap-2.5" role="list">
              <li>
                <Link
                  href="/shop"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=tees"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  Tees
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=hoodies"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  Hoodies
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?newArrival=true"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  New Drops
                </Link>
              </li>
              <li>
                <Link
                  href="/collections"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* HELP COLUMN */}
          <div>
            <h3 className="text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-[#f3f0e8] mb-4">
              HELP
            </h3>
            <ul className="flex flex-col gap-2.5" role="list">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  Shipping
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  Returns
                </Link>
              </li>
              <li>
                <Link
                  href="/size-guide"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  Size Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/faqs"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* COMPANY COLUMN */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="text-[11px] sm:text-xs font-semibold tracking-[0.14em] uppercase text-[#f3f0e8] mb-4">
              COMPANY
            </h3>
            <ul className="flex flex-col gap-2.5" role="list">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-[#9c978e] hover:text-[#f3f0e8] transition-colors duration-200 inline-block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>

    {/* ZONE 4 — COPYRIGHT / LEGAL ROW */}
    <div className="border-t border-white/[0.08]">
      <div className="container-odessi py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[11px] tracking-[0.12em] uppercase text-[#737373] text-center sm:text-left">
          © 2026 ODESSI.TFI
        </p>
        <div className="flex items-center gap-6 text-[11px] tracking-[0.12em] uppercase text-[#737373]">
          <Link
            href="/privacy"
            className="hover:text-[#f3f0e8] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-[#f3f0e8] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#b89a5a]"
          >
            Terms
          </Link>
        </div>
      </div>
    </div>
  </footer>
  );
}
