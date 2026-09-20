import Link from "next/link";
import Image from "next/image";
import IconInstagram from "@/components/ui/IconInstagram";

export default function Footer() {
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL;
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL;

  return (
    <footer
      role="contentinfo"
      className="bg-[#080808] text-[#A3A3A3] border-t border-[#1F1F1F]"
    >
      {/* Main Container */}
      <div className="container-odessi py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* Column 1: Brand Header & Story */}
          <div className="col-span-2 md:col-span-4 lg:col-span-4 flex flex-col gap-5">
            <Link href="/" aria-label="ODESSI.TFI Home">
              <Image
                src="/logo-light.svg"
                alt="ODESSI.TFI"
                width={200}
                height={36}
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </Link>

            <div className="space-y-1">
              <p className="text-xs tracking-[0.2em] font-mono text-[#D4AF37] uppercase font-semibold">
                WEAR YOUR STORY.
              </p>
              <p className="type-body text-[#A3A3A3] text-sm max-w-sm leading-relaxed">
                Premium hero-inspired clothing. Designed for those who carry their own story.
              </p>
            </div>

            {/* Social Icons with Accessibility & Strict Configuration */}
            <div className="flex items-center gap-3 mt-2">
              {/* Instagram - Always verified */}
              <a
                href="https://instagram.com/odessi.tfi"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow ODESSI.TFI on Instagram (opens in new tab)"
                className="min-w-[44px] min-h-[44px] border border-[#2A2A2A] rounded-sm flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#D4AF37] hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all duration-200"
              >
                <IconInstagram size={18} strokeWidth={1.5} />
              </a>

              {/* Email */}
              <a
                href="mailto:hello@odessi.shop"
                aria-label="Send email to hello@odessi.shop"
                className="min-w-[44px] min-h-[44px] border border-[#2A2A2A] rounded-sm flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#D4AF37] hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>

              {/* Facebook (ONLY rendered if configured via NEXT_PUBLIC_FACEBOOK_URL) */}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit ODESSI.TFI on Facebook (opens in new tab)"
                  className="min-w-[44px] min-h-[44px] border border-[#2A2A2A] rounded-sm flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#D4AF37] hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
              )}

              {/* Telegram (ONLY rendered if configured via NEXT_PUBLIC_TELEGRAM_URL) */}
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join ODESSI.TFI on Telegram (opens in new tab)"
                  className="min-w-[44px] min-h-[44px] border border-[#2A2A2A] rounded-sm flex items-center justify-center text-[#A3A3A3] hover:text-white hover:border-[#D4AF37] hover:bg-[#141414] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.67-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.6 3.98-1.65 4.81-1.94 5.35-1.95.12 0 .38.03.55.17.14.12.18.28.2.46-.01.07.01.24 0 .38z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Shop Links */}
          <div className="col-span-1 lg:col-span-2 lg:col-start-6">
            <h3 className="type-caption text-white font-semibold mb-5 tracking-wider uppercase text-xs">
              SHOP
            </h3>
            <ul className="flex flex-col gap-3" role="list">
              <li>
                <Link href="/shop" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/shop?category=tees" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  Tees
                </Link>
              </li>
              <li>
                <Link href="/shop?category=hoodies" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  Hoodies
                </Link>
              </li>
              <li>
                <Link href="/shop?newArrival=true" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  New Drops
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Help Links */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="type-caption text-white font-semibold mb-5 tracking-wider uppercase text-xs">
              HELP
            </h3>
            <ul className="flex flex-col gap-3" role="list">
              <li>
                <Link href="/contact" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company Links */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="type-caption text-white font-semibold mb-5 tracking-wider uppercase text-xs">
              COMPANY
            </h3>
            <ul className="flex flex-col gap-3" role="list">
              <li>
                <Link href="/about" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact Direct Info */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="type-caption text-white font-semibold mb-5 tracking-wider uppercase text-xs">
              CONTACT
            </h3>
            <div className="flex flex-col gap-2.5">
              <a
                href="mailto:hello@odessi.shop"
                className="text-sm text-[#A3A3A3] hover:text-[#D4AF37] transition-colors font-mono"
              >
                hello@odessi.shop
              </a>
              <a
                href="https://instagram.com/odessi.tfi"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ODESSI.TFI Instagram Profile"
                className="text-sm text-[#A3A3A3] hover:text-white transition-colors"
              >
                @odessi.tfi
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="border-t border-[#1F1F1F] bg-[#050505]">
        <div className="container-odessi py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="type-caption text-xs text-[#737373] text-center sm:text-left font-mono">
            © 2026 ODESSI.TFI. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-[#737373]">
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-white transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
