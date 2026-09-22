import { apiPost } from "./client";

export interface NewsletterResponse {
  id: number;
  email: string;
  active: boolean;
  source: string;
  couponCode: string;
  message: string;
  createdAt: string;
}

export const subscribeToNewsletter = async (
  email: string,
  source = "HOMEPAGE"
): Promise<NewsletterResponse> => {
  return apiPost<NewsletterResponse>("/api/newsletter/subscribe", { email, source });
};
