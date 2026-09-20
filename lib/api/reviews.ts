import { apiGet, apiPost, apiPatch, buildQueryString } from './client';

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProductReview {
  id: number;
  productId: number;
  productName: string;
  userId: number;
  userName: string;
  orderId: number;
  orderNumber: string;
  rating: number;
  title: string | null;
  comment: string;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface ProductRatingSummary {
  productId: number;
  averageRating: number;
  totalReviews: number;
}

export interface CreateReviewRequest {
  orderId: number;
  rating: number;
  title?: string;
  comment: string;
}

export interface PagedReviewsResponse {
  content: ProductReview[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const getProductReviews = async (productId: number, page = 0, size = 10): Promise<PagedReviewsResponse> => {
  const query = buildQueryString({ page, size });
  return apiGet<PagedReviewsResponse>(`/api/products/${productId}/reviews${query}`);
};

export const getProductRatingSummary = async (productId: number): Promise<ProductRatingSummary> => {
  return apiGet<ProductRatingSummary>(`/api/products/${productId}/reviews/summary`);
};

export const submitProductReview = async (productId: number, data: CreateReviewRequest): Promise<ProductReview> => {
  return apiPost<ProductReview>(`/api/products/${productId}/reviews`, data);
};

export const getAdminReviews = async (status?: ReviewStatus, page = 0, size = 20): Promise<PagedReviewsResponse> => {
  const query = buildQueryString({ status, page, size });
  return apiGet<PagedReviewsResponse>(`/api/admin/reviews${query}`);
};

export const moderateReview = async (id: number, status: ReviewStatus): Promise<ProductReview> => {
  return apiPatch<ProductReview>(`/api/admin/reviews/${id}/status?status=${status}`);
};
