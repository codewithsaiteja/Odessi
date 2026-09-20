import { apiGet, apiPatch, apiPost, buildQueryString } from "./client";
import { User } from "@/lib/auth/AuthContext";

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UserReviewResponse {
  id: number;
  productId: number;
  productName: string;
  userId: number;
  userName: string;
  orderId: number;
  orderNumber: string;
  rating: number;
  title: string;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface PagedUserReviewsResponse {
  data?: UserReviewResponse[];
  content?: UserReviewResponse[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export async function getUserProfile(): Promise<User> {
  return apiGet<User>("/api/users/me");
}

export async function updateUserProfile(data: UpdateProfileData): Promise<User> {
  return apiPatch<User>("/api/users/me", data);
}

export async function changeUserPassword(data: ChangePasswordData): Promise<void> {
  return apiPost("/api/users/me/change-password", data);
}

export async function getUserReviews(page = 0, size = 10): Promise<PagedUserReviewsResponse> {
  const query = buildQueryString({ page, size });
  return apiGet<PagedUserReviewsResponse>(`/api/users/me/reviews${query}`);
}
