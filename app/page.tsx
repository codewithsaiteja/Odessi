import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import FeaturedCollections from "@/components/sections/FeaturedCollections";
import BestSellers from "@/components/sections/BestSellers";
import BrandStory from "@/components/sections/BrandStory";
import ShopByCategory from "@/components/sections/ShopByCategory";
import NewDrop from "@/components/sections/NewDrop";
import CustomSection from "@/components/sections/CustomSection";
import InstagramGrid from "@/components/sections/InstagramGrid";
import Newsletter from "@/components/sections/Newsletter";
import { LetsGrowTogether } from "@/components/home/LetsGrowTogether";
import { LimitedDropSection } from "@/components/home/LimitedDropSection";
import { WhatsAppCTA } from "@/components/common/WhatsAppCTA";

// Enable Next.js Incremental Static Regeneration (ISR)
// Caches at Vercel Edge CDN with background revalidation every 60s
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      {/* ── Fixed top bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AnnouncementBar />
      </div>

      {/* ── Navbar — sits below announcement bar ── */}
      <Navbar />

      {/* ── Main content ── */}
      <main id="main-content">
        {/* 1. Hero — full screen cinematic */}
        <Hero />

        {/* 2. Featured Collections */}
        <FeaturedCollections />

        {/* 3. Best Sellers */}
        <BestSellers />

        {/* 4. Limited Drops */}
        <div className="max-w-7xl mx-auto px-4">
          <LimitedDropSection />
        </div>

        {/* 5. Brand Story */}
        <BrandStory />

        {/* 6. Shop by Category */}
        <ShopByCategory />

        {/* 7. New Drop — editorial split */}
        <NewDrop />

        {/* 8. Custom / Personalisation */}
        <CustomSection />

        {/* 9. Let's Grow Together (Partner CTA) */}
        <div className="max-w-7xl mx-auto px-4">
          <LetsGrowTogether />
        </div>

        {/* 10. Instagram */}
        <InstagramGrid />

        {/* 11. Newsletter */}
        <Newsletter />
      </main>

      {/* ── Subtle Floating WhatsApp Concierge ── */}
      <WhatsAppCTA />

      {/* ── Footer ── */}
      <Footer />
    </>
  );
}
