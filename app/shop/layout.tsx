import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop | ODESSI.TFI — Premium Hero-Inspired Apparel",
  description:
    "Explore the complete Odessi.tfi collection. Hero-inspired tees, hoodies, and heavyweight apparel built for those who carry their own story.",
  alternates: {
    canonical: "https://odessi.shop/shop",
  },
  openGraph: {
    title: "Shop | ODESSI.TFI — Premium Hero-Inspired Apparel",
    description:
      "Explore the complete Odessi.tfi collection. Hero-inspired tees, hoodies, and heavyweight apparel built for those who carry their own story.",
    url: "https://odessi.shop/shop",
    siteName: "Odessi.tfi",
    type: "website",
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
