import { apiGet, apiPost, apiPut, apiPatch } from './client';

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface Coupon {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  startDate: string | null;
  expiryDate: string | null;
  totalUsageLimit: number | null;
  perCustomerLimit: number;
  timesUsed: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidation {
  valid: boolean;
  code: string;
  discountType: DiscountType | null;
  discountValue: number;
  calculatedDiscount: number;
  subtotal: number;
  newSubtotal: number;
  message: string;
}

export interface CouponRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number | null;
  startDate?: string | null;
  expiryDate?: string | null;
  totalUsageLimit?: number | null;
  perCustomerLimit?: number;
  active?: boolean;
}

export const validateCoupon = async (code: string, subtotal: number): Promise<CouponValidation> => {
  const params = new URLSearchParams({ code, subtotal: subtotal.toString() });
  return apiGet<CouponValidation>(`/api/coupons/validate?${params.toString()}`);
};

export const getAdminCoupons = async (): Promise<Coupon[]> => {
  return apiGet<Coupon[]>('/api/admin/coupons');
};

export const createCoupon = async (data: CouponRequest): Promise<Coupon> => {
  return apiPost<Coupon>('/api/admin/coupons', data);
};

export const updateCoupon = async (id: number, data: CouponRequest): Promise<Coupon> => {
  return apiPut<Coupon>(`/api/admin/coupons/${id}`, data);
};

export const toggleCouponActive = async (id: number): Promise<Coupon> => {
  return apiPatch<Coupon>(`/api/admin/coupons/${id}/toggle-active`);
};
