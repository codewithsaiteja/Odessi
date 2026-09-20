/**
 * ODESSI.TFI — Site-wide configuration
 *
 * All user-facing strings, links, and brand values live here.
 * Change content from this single file — never hardcode in components.
 */

export const siteConfig = {
  /* ── Brand ── */
  name: "Odessi.tfi",
  tagline: "Premium Hero-Inspired Clothing",
  description:
    "Odessi.tfi creates premium cinematic clothing inspired by iconic heroes, stories and the energy of Indian cinema. Wear the story.",
  domain: "odessi.shop",
  url: "https://odessi.shop",
  instagramUrl: "https://www.instagram.com/odessi.tfi",
  instagramHandle: "@odessi.tfi",
  email: "hello@odessi.shop",
  phone: "+91 00000 00000", // update when live

  /* ── Announcement bar ── */
  announcement: {
    enabled: true,
    messages: [
      "FREE SHIPPING ON ORDERS ABOVE ₹999",
      "NEW DROP: DARK VERSE COLLECTION — SHOP NOW",
      "CUSTOM TEES NOW AVAILABLE — MAKE IT YOURS",
    ],
    // Rotates through the messages array if more than one
    interval: 4000, // ms
  },

  /* ── Navigation ── */
  nav: {
    primary: [
      { label: "Shop", href: "/shop" },
      { label: "Collections", href: "/collections" },
      { label: "New Drops", href: "/shop?newArrival=true" },
      { label: "About", href: "/about" },
    ],
    footer: {
      shop: [
        { label: "All Products", href: "/shop" },
        { label: "Tees", href: "/shop?category=tees" },
        { label: "Hoodies", href: "/shop?category=hoodies" },
        { label: "New Drops", href: "/shop?newArrival=true" },
        { label: "Collections", href: "/collections" },
      ],
      help: [
        { label: "Contact", href: "/contact" },
        { label: "Shipping", href: "/shipping" },
        { label: "Returns", href: "/returns" },
        { label: "Size Guide", href: "/size-guide" },
        { label: "FAQs", href: "/faqs" },
      ],
      company: [
        { label: "About", href: "/about" },
        { label: "Instagram", href: "https://www.instagram.com/odessi.tfi" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  },

  /* ── Hero section ── */
  hero: {
    headline: "WEAR YOUR\nSTORY.",
    subHeadline: "Hero-inspired pieces designed for those\nwho carry their own story.",
    primaryCta: { label: "EXPLORE COLLECTION →", href: "/shop" },
    secondaryCta: { label: "OUR STORY", href: "/about" },
    // Replace with real hero image from cloud storage
    image:
      "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=2400&q=90",
    imageMobile:
      "https://images.unsplash.com/photo-1536922246289-88c42f957773?w=900&q=90",
  },

  /* ── Featured collection section ── */
  featuredCollection: {
    eyebrow: "The Latest Drop",
    headline: "DARK VERSE",
    subHeadline:
      "Written in shadows. Worn in light. The Dark Verse collection redefines hero-inspired clothing with heavyweight pieces in deep monochromes.",
  },

  /* ── Best sellers section ── */
  bestSellers: {
    eyebrow: "Selected For You",
    headline: "BESTSELLERS",
    subHeadline: "The pieces our customers return to.",
  },

  /* ── Brand story section ── */
  brandStory: {
    eyebrow: "OUR STORY",
    headline: "WEAR YOUR\nSTORY.",
    body: "Odessi.tfi is built around a simple idea — what you wear can say something about who you are.\n\nWe create hero-inspired apparel with a focus on strong silhouettes, considered details and everyday wearability.\n\nEvery piece is designed to carry a character. You bring the story.",
    cta: { label: "DISCOVER ODESSI", href: "/about" },
    image:
      "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=1600&q=90",
  },

  /* ── Shop by category ── */
  shopByCategory: {
    eyebrow: "Find Your Fit",
    headline: "SHOP BY CATEGORY",
  },

  /* ── New drop feature section ── */
  newDrop: {
    eyebrow: "New Arrival",
    collectionName: "Dark Verse — SS 2026",
    cta: { label: "SHOP NOW", href: "/collections/dark-verse" },
  },

  /* ── Custom section ── */
  custom: {
    eyebrow: "Personalization",
    headline: "MAKE IT\nYOURS.",
    body: "Your story. Your hero. Your design.\n\nBring your vision — we'll bring the premium build and print quality. Every custom Odessi piece is crafted on demand.",
    cta: { label: "CREATE YOUR CUSTOM TEE", href: "/shop?category=custom" },
    image:
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1400&q=90",
  },

  /* ── Instagram section ── */
  instagram: {
    eyebrow: "Follow The World",
    headline: "FOLLOW THE\nODESSI WORLD",
    handle: "@odessi.tfi",
    profileUrl: "https://www.instagram.com/odessi.tfi",
    // Replace with real IG images when integration is set up
    images: [
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80",
      "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600&q=80",
      "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=600&q=80",
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&q=80",
    ],
  },

  /* ── Newsletter section ── */
  newsletter: {
    eyebrow: "Odessi Club",
    headline: "STAY IN THE\nSTORY.",
    body: "Get new drops, collection updates and selected Odessi.tfi news.",
    placeholder: "Your email address",
    cta: "SUBSCRIBE",
  },

  /* ── Footer ── */
  footer: {
    brandDescription:
      "Premium hero-inspired clothing. Wear the story.",
    copyright: `© ${new Date().getFullYear()} Odessi.tfi. All rights reserved.`,
  },

  /* ── Shipping thresholds ── */
  shipping: {
    freeShippingThreshold: 999,
    baseShippingCost: 99,
  },
} as const;

export type SiteConfig = typeof siteConfig;
