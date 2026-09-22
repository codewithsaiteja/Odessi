import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiPostFormData, buildQueryString } from "./client";

export interface SocialPost {
  id: number;
  mediaUrl: string;
  instagramUrl?: string;
  caption?: string;
  title?: string;
  productId?: number;
  productName?: string;
  productSlug?: string;
  productPrice?: number;
  productCompareAtPrice?: number;
  productCurrency?: string;
  productImageUrl?: string;
  collectionId?: number;
  collectionName?: string;
  collectionSlug?: string;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialPostInput {
  mediaUrl: string;
  instagramUrl?: string;
  caption?: string;
  title?: string;
  productId?: number | null;
  collectionId?: number | null;
  published?: boolean;
  displayOrder?: number;
}

export interface PagedSocialPostsResponse {
  content: SocialPost[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const getPublishedSocialPosts = async (): Promise<SocialPost[]> => {
  return apiGet<SocialPost[]>("/api/social/posts");
};

export const getSocialPostsForProduct = async (productId: number): Promise<SocialPost[]> => {
  return apiGet<SocialPost[]>(`/api/social/posts/product/${productId}`);
};

export const getAdminSocialPosts = async (page = 0, size = 20): Promise<PagedSocialPostsResponse> => {
  const query = buildQueryString({ page, size });
  return apiGet<PagedSocialPostsResponse>(`/api/admin/social/posts${query}`);
};

export const createSocialPost = async (data: CreateSocialPostInput): Promise<SocialPost> => {
  return apiPost<SocialPost>("/api/admin/social/posts", data);
};

export const updateSocialPost = async (id: number, data: CreateSocialPostInput): Promise<SocialPost> => {
  return apiPut<SocialPost>(`/api/admin/social/posts/${id}`, data);
};

export const deleteSocialPost = async (id: number): Promise<{ message: string }> => {
  return apiDelete<{ message: string }>(`/api/admin/social/posts/${id}`);
};

export const togglePublishSocialPost = async (id: number, published: boolean): Promise<SocialPost> => {
  return apiPatch<SocialPost>(`/api/admin/social/posts/${id}/publish?published=${published}`);
};

export const updateSocialPostOrder = async (id: number, order: number): Promise<SocialPost> => {
  return apiPatch<SocialPost>(`/api/admin/social/posts/${id}/order?order=${order}`);
};

export const uploadSocialImage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append("file", file);
  return apiPostFormData<{ url: string }>("/api/admin/social/upload", formData);
};
