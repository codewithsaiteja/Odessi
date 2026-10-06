/**
 * ODESSI.TFI — Growth Features API Client
 */

import { apiGet, apiPost, apiPatch, apiPut, buildQueryString } from "./client";
import { Product } from "@/types";

export interface PartnershipRequest {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  businessType: string;
  message?: string;
}

export interface PartnershipResponse {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  businessType: string;
  message?: string;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "REJECTED";
  internalNotes?: string;
  createdAt: string;
}

export interface CustomOrderRequest {
  organizationName: string;
  contactName: string;
  email: string;
  phone: string;
  orderType: string;
  estimatedQuantity: number;
  message?: string;
}

export interface CustomOrderResponse {
  id: number;
  organizationName: string;
  contactName: string;
  email: string;
  phone: string;
  orderType: string;
  estimatedQuantity: number;
  message?: string;
  status: "NEW" | "IN_REVIEW" | "QUOTED" | "CONFIRMED" | "CANCELLED";
  internalNotes?: string;
  createdAt: string;
}

export interface BackInStockSubscribeRequest {
  productId: number;
  variantId: number;
  email: string;
}

export interface BackInStockResponse {
  id: number;
  productId: number;
  productName: string;
  variantId: number;
  variantSku: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface ReferralResponse {
  /** Customer's referral code */
  code: string;
  /** Full share URL with code embedded */
  shareUrl?: string;
  /** Total registered referees (all statuses) */
  totalReferrals: number;
  /** Number of referrals that reached QUALIFIED status */
  qualifiedReferrals: number;
  /** Total rewards earned by this customer (historical, from immutable ledger) */
  totalRewardsEarned: number;
  /**
   * Current reward per successful referral — fetched from admin-controlled
   * backend settings. NEVER hardcode this value on the frontend.
   */
  referrerRewardAmount: number;
  /** Referred customer reward — always 0. Do not display as a benefit. */
  refereeRewardAmount: number;
  /** Whether the referral program is currently enabled by admin. */
  programEnabled: boolean;
  createdAt?: string;
}

export interface LoyaltyAccountResponse {
  tier: "STANDARD" | "MEMBER";
  status: string;
  joinedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const growthApi = {
  // ── Partnerships ────────────────────────────────────────────────────────
  submitPartnership(data: PartnershipRequest): Promise<PartnershipResponse> {
    return apiPost<PartnershipResponse>("/api/partnerships", data);
  },
  getPartnerships(params?: { status?: string; search?: string; page?: number; size?: number }): Promise<PageResponse<PartnershipResponse>> {
    const query = buildQueryString(params || {});
    return apiGet<PageResponse<PartnershipResponse>>(`/api/admin/partnerships${query}`);
  },
  updatePartnershipStatus(id: number, status: string): Promise<PartnershipResponse> {
    return apiPatch<PartnershipResponse>(`/api/admin/partnerships/${id}/status`, { status });
  },
  updatePartnershipNotes(id: number, internalNotes: string): Promise<PartnershipResponse> {
    return apiPatch<PartnershipResponse>(`/api/admin/partnerships/${id}/notes`, { internalNotes });
  },

  // ── Custom Orders ────────────────────────────────────────────────────────
  submitCustomOrder(data: CustomOrderRequest): Promise<CustomOrderResponse> {
    return apiPost<CustomOrderResponse>("/api/custom-orders", data);
  },
  getCustomOrders(params?: { status?: string; search?: string; page?: number; size?: number }): Promise<PageResponse<CustomOrderResponse>> {
    const query = buildQueryString(params || {});
    return apiGet<PageResponse<CustomOrderResponse>>(`/api/admin/custom-orders${query}`);
  },
  updateCustomOrderStatus(id: number, status: string): Promise<CustomOrderResponse> {
    return apiPatch<CustomOrderResponse>(`/api/admin/custom-orders/${id}/status`, { status });
  },
  updateCustomOrderNotes(id: number, internalNotes: string): Promise<CustomOrderResponse> {
    return apiPatch<CustomOrderResponse>(`/api/admin/custom-orders/${id}/notes`, { internalNotes });
  },

  // ── Back In Stock ────────────────────────────────────────────────────────
  subscribeBackInStock(data: BackInStockSubscribeRequest): Promise<BackInStockResponse> {
    return apiPost<BackInStockResponse>("/api/back-in-stock/subscribe", data);
  },
  getBackInStockDemand(params?: { page?: number; size?: number }): Promise<PageResponse<BackInStockResponse>> {
    const query = buildQueryString(params || {});
    return apiGet<PageResponse<BackInStockResponse>>(`/api/back-in-stock/admin/demand${query}`);
  },

  // ── Drops ────────────────────────────────────────────────────────────────
  getDrops(params?: { page?: number; size?: number }): Promise<PageResponse<Product>> {
    const query = buildQueryString(params || {});
    return apiGet<PageResponse<Product>>(`/api/admin/drops${query}`);
  },
  configureDrop(productId: number, data: { isDrop: boolean; dropTitle?: string; dropDescription?: string; launchAt?: string }): Promise<Product> {
    return apiPut<Product>(`/api/admin/drops/${productId}/configure`, data);
  },

  // ── Referral & Loyalty ───────────────────────────────────────────────────
  getMyReferralCode(): Promise<ReferralResponse> {
    return apiGet<ReferralResponse>("/api/referral/my-code");
  },
  getLoyaltyStatus(): Promise<LoyaltyAccountResponse> {
    return apiGet<LoyaltyAccountResponse>("/api/loyalty/status");
  },
};
