import { apiGet, apiPut } from "./client";

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
