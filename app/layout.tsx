import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { AuthProvider } from "@/lib/auth/AuthContext";
import "./globals.css";

/* ── Fonts ── */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  fallback: ["system-ui", "sans-serif"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  fallback: ["Georgia", "serif"],
});

/* ── Metadata ── */
export const metadata: Metadata = {
  title: {
    default: "Odessi.tfi — Premium Hero-Inspired Clothing",
    template: "%s | Odessi.tfi",
  },
  description:
    "Premium cinematic clothing inspired by iconic heroes and stories. Shop tees, hoodies, and custom pieces at odessi.shop.",
  keywords: [
    "odessi",
    "hero inspired clothing",
    "premium streetwear",
    "cinematic fashion",
    "Indian streetwear",
    "custom tees",
    "odessi.tfi",
  ],
  authors: [{ name: "Odessi.tfi" }],
  creator: "Odessi.tfi",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://odessi.shop",
    siteName: "Odessi.tfi",
    title: "Odessi.tfi — Premium Hero-Inspired Clothing",
    description:
      "Wear the story. Premium cinematic clothing for those who carry the narrative.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Odessi.tfi — Premium Hero-Inspired Clothing",
    description: "Wear the story. Premium cinematic clothing.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  metadataBase: new URL("https://odessi.shop"),
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

/* ── Layout ── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${cormorant.variable} scroll-smooth`}
    >
      <body className="antialiased">
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
