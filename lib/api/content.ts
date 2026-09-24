import { apiGet, apiPut, apiPostFormData } from "./client";

export interface HomepageSection {
  id: number;
  sectionKey: string;
  title?: string;
  eyebrow?: string;
  headline?: string;
  subHeadline?: string;
  body?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  mediaUrl?: string;
  mobileMediaUrl?: string;
  active: boolean;
  customPayload?: string;
  updatedAt: string;
}

export interface UpdateHomepageSectionInput {
  title?: string;
  eyebrow?: string;
  headline?: string;
  subHeadline?: string;
  body?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  mediaUrl?: string;
  mobileMediaUrl?: string;
  active?: boolean;
  customPayload?: string;
}

export interface FeaturedCollectionCardItem {
  id: string;
  title: string;
  description: string;
  collectionUrl: string;
  ctaLabel: string;
  image: string;
  active: boolean;
  displayOrder: number;
}

export const DEFAULT_FEATURED_COLLECTION_CARDS: FeaturedCollectionCardItem[] = [
  {
    id: "dark-verse",
    title: "DARK VERSE",
    description: "Written in shadows. Worn in light. The Dark Verse collection redefines hero-inspired clothing with heavyweight pieces in deep monochromes.",
    collectionUrl: "/collections/dark-verse",
    ctaLabel: "EXPLORE",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&q=85",
    active: true,
    displayOrder: 1,
  },
  {
    id: "monochrome-edit",
    title: "MONOCHROME EDIT",
    description: "High-density monochrome staples cut from 280 GSM combed cotton.",
    collectionUrl: "/collections/monochrome-edit",
    ctaLabel: "EXPLORE",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=85",
    active: true,
    displayOrder: 2,
  },
  {
    id: "rogue-arc",
    title: "ROGUE ARC",
    description: "Distressed treatments and industrial graphics inspired by cinematic antiheroes.",
    collectionUrl: "/collections/rogue-arc",
    ctaLabel: "EXPLORE",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=85",
    active: true,
    displayOrder: 3,
  },
];

export const getHomepageContent = async (): Promise<HomepageSection[]> => {
  return apiGet<HomepageSection[]>("/api/homepage/content");
};

export const getAdminHomepageContent = async (): Promise<HomepageSection[]> => {
  return apiGet<HomepageSection[]>("/api/admin/homepage/content");
};

export const updateHomepageSection = async (
  sectionKey: string,
  data: UpdateHomepageSectionInput
): Promise<HomepageSection> => {
  return apiPut<HomepageSection>(`/api/admin/homepage/content/${sectionKey}`, data);
};

export const uploadContentImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormData<{ url: string }>("/api/admin/homepage/content/upload", formData);
};
