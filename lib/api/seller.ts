/**
 * ODESSI.TFI — Trusted Sellers Program API Client
 */

import { apiGet, apiPost, apiPatch, apiPut, apiPostFormData, buildQueryString, ApiError } from "./client";
import { PageResponse } from "./growth";

export type SellerStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type SellerRewardStatus =
  | "UNLOCKED"
  | "CLAIMED"
  | "APPROVED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface SellerResponse {
  id: number;
  userId: number;
  sellerCode: string;
  fullName: string;
  email: string;
  phone: string;
  socialChannel: string;
  applicationReason: string;
  status: SellerStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  verifiedSalesCount: number;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  suspendedAt?: string;
}

export interface SellerMilestoneConfigResponse {
  id: number;
  tierLevel: number;
  milestoneName: string;
  qualifyingSalesThreshold: number;
  rewardTitle: string;
  rewardDescription: string;
  rewardType: string;
  imageUrl?: string;
  active: boolean;
  version: number;
}

export interface SellerRewardResponse {
  id: number;
  sellerId: number;
  milestoneConfigId: number;
  tierLevel: number;
  milestoneNameSnapshot: string;
  rewardTitleSnapshot: string;
  rewardDescriptionSnapshot: string;
  imageUrl?: string;
  qualifyingSalesAtUnlock: number;
  status: SellerRewardStatus;
  unlockedAt: string;
  claimedAt?: string;
  shippingFullName?: string;
  shippingPhone?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  tshirtSize?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  adminNotes?: string;
}

export interface SellerDashboardResponse {
  seller: SellerResponse;
  verifiedSales: number;
  pendingOrders: number;
  currentMilestone?: SellerMilestoneConfigResponse | null;
  nextMilestone?: SellerMilestoneConfigResponse | null;
  remainingSalesToNextMilestone: number;
  progressPercent: number;
  milestones: SellerMilestoneConfigResponse[];
  rewards: SellerRewardResponse[];
  shareableLink?: string;
}

export interface SellerApplyRequest {
  fullName: string;
  email: string;
  phone: string;
  socialChannel: string;
  applicationReason: string;
  agreeToTerms?: boolean;
  termsAccepted?: boolean;
}

export interface SellerRewardClaimRequest {
  shippingFullName: string;
  shippingPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  tshirtSize?: string;
}

export interface SellerAttributionResponse {
  id: number;
  orderId: number;
  orderNumber: string;
  orderTotal: number;
  sellerId: number;
  sellerCodeUsed: string;
  customerEmail: string;
  customerName: string;
  isQualifying: boolean;
  qualificationStatus: string;
  qualificationReason?: string;
  createdAt: string;
  qualifiedAt?: string;
}

export interface SellerAuditLogResponse {
  id: number;
  sellerId: number;
  adminEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface SellerMilestoneConfigRequest {
  tierLevel?: number;
  milestoneName: string;
  qualifyingSalesThreshold: number;
  rewardTitle: string;
  rewardDescription: string;
  rewardType: string;
  imageUrl?: string;
  active: boolean;
}

export interface SellerStatusUpdateRequest {
  status: SellerStatus;
  reason?: string;
}

export interface SellerRewardStatusUpdateRequest {
  status: SellerRewardStatus;
  shippingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  adminNotes?: string;
}

export interface SellerPerformanceStatsResponse {
  totalApplications: number;
  pendingApplications: number;
  approvedSellers: number;
  rejectedSellers: number;
  suspendedSellers: number;
  verifiedQualifyingSales: number;
  totalEligibleOrderValue: number;
  pendingAttributions: number;
  disqualifiedAttributions: number;
  milestonesUnlocked: number;
  rewardsAwaitingApproval: number;
  rewardsAwaitingShipment: number;
  rewardsDelivered: number;
}

export interface SellerGiftMediaItem {
  url: string;
  filename: string;
  usedInMilestones: string[];
  isDefault: boolean;
}

// ── Customer Seller API ──────────────────────────────────────────────────────

export const sellerApi = {
  /**
   * Submit application to become a Trusted Seller
   */
  async apply(data: SellerApplyRequest): Promise<SellerResponse> {
    const payload = {
      ...data,
      termsAccepted: data.termsAccepted ?? data.agreeToTerms ?? true,
      agreeToTerms: data.agreeToTerms ?? data.termsAccepted ?? true,
    };
    return apiPost<SellerResponse>("/api/seller/apply", payload);
  },

  /**
   * Fetch active milestone reward tiers for public/storefront display
   */
  async getActiveMilestones(): Promise<SellerMilestoneConfigResponse[]> {
    return apiGet<SellerMilestoneConfigResponse[]>("/api/seller/milestones");
  },

  /**
   * Check status of user's seller application
   */
  async getStatus(): Promise<SellerResponse | null> {
    try {
      return await apiGet<SellerResponse>("/api/seller/status");
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 404 || err.errorCode === "NOT_FOUND")) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Fetch approved seller dashboard data
   */
  async getDashboard(): Promise<SellerDashboardResponse> {
    return apiGet<SellerDashboardResponse>("/api/seller/dashboard");
  },

  /**
   * Claim an unlocked physical reward gift
   */
  async claimReward(rewardId: number, data: SellerRewardClaimRequest): Promise<SellerRewardResponse> {
    return apiPost<SellerRewardResponse>(`/api/seller/rewards/${rewardId}/claim`, data);
  },

  /**
   * Validate a seller attribution code
   */
  async validateCode(code: string): Promise<boolean> {
    try {
      const res = await apiGet<{ valid: boolean }>(`/api/seller/validate-code?code=${encodeURIComponent(code)}`);
      return !!res?.valid;
    } catch {
      return false;
    }
  },

  // ── Admin Seller API ───────────────────────────────────────────────────────

  async getAdminSellers(params?: {
    status?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<SellerResponse>> {
    const query = buildQueryString(params || {});
    return apiGet<PageResponse<SellerResponse>>(`/api/admin/sellers${query}`);
  },

  async getAdminSellerById(id: number): Promise<SellerResponse> {
    return apiGet<SellerResponse>(`/api/admin/sellers/${id}`);
  },

  async updateAdminSellerStatus(id: number, data: SellerStatusUpdateRequest): Promise<SellerResponse> {
    return apiPatch<SellerResponse>(`/api/admin/sellers/${id}/status`, data);
  },

  async getAdminSellerAuditLogs(id: number): Promise<SellerAuditLogResponse[]> {
    return apiGet<SellerAuditLogResponse[]>(`/api/admin/sellers/${id}/audit`);
  },

  async getAdminMilestones(): Promise<SellerMilestoneConfigResponse[]> {
    return apiGet<SellerMilestoneConfigResponse[]>("/api/admin/sellers/milestones");
  },

  async createAdminMilestone(data: SellerMilestoneConfigRequest): Promise<SellerMilestoneConfigResponse> {
    return apiPost<SellerMilestoneConfigResponse>("/api/admin/sellers/milestones", data);
  },

  async updateAdminMilestone(id: number, data: SellerMilestoneConfigRequest): Promise<SellerMilestoneConfigResponse> {
    return apiPut<SellerMilestoneConfigResponse>(`/api/admin/sellers/milestones/${id}`, data);
  },

  async getAdminRewardClaims(params?: {
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<SellerRewardResponse>> {
    const query = buildQueryString(params || {});
    return apiGet<PageResponse<SellerRewardResponse>>(`/api/admin/sellers/rewards${query}`);
  },

  async updateAdminRewardStatus(
    rewardId: number,
    data: SellerRewardStatusUpdateRequest
  ): Promise<SellerRewardResponse> {
    return apiPatch<SellerRewardResponse>(`/api/admin/sellers/rewards/${rewardId}/status`, data);
  },

  async getAdminAttributions(params?: {
    sellerId?: number;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<SellerAttributionResponse>> {
    const query = buildQueryString(params || {});
    return apiGet<PageResponse<SellerAttributionResponse>>(`/api/admin/sellers/attributions${query}`);
  },

  async overrideAdminAttribution(
    id: number,
    qualifying: boolean,
    reason: string
  ): Promise<SellerAttributionResponse> {
    return apiPatch<SellerAttributionResponse>(`/api/admin/sellers/attributions/${id}/override`, {
      qualifying,
      reason,
    });
  },

  async getAdminPerformanceStats(): Promise<SellerPerformanceStatsResponse> {
    return apiGet<SellerPerformanceStatsResponse>("/api/admin/sellers/stats");
  },

  async getAllAdminAuditLogs(params?: {
    page?: number;
    size?: number;
  }): Promise<PageResponse<SellerAuditLogResponse>> {
    const query = buildQueryString(params || {});
    return apiGet<PageResponse<SellerAuditLogResponse>>(`/api/admin/sellers/audit-logs${query}`);
  },

  async uploadGiftMedia(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append("file", file);
    return apiPostFormData<{ url: string; filename: string }>("/api/admin/sellers/media/upload", formData);
  },

  async getGiftMediaList(): Promise<SellerGiftMediaItem[]> {
    return apiGet<SellerGiftMediaItem[]>("/api/admin/sellers/media");
  },
};
