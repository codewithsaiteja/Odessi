import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  charge: number;
  freeShippingThreshold: number | null;
  estimatedDays: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingCalculation {
  shippingMethodId: number | null;
  name: string;
  code: string;
  subtotal: number;
  charge: number;
  freeShippingThreshold: number | null;
  isFreeShipping: boolean;
}

export interface ShippingMethodRequest {
  name: string;
  code: string;
  charge: number;
  freeShippingThreshold?: number | null;
  estimatedDays?: string;
  active?: boolean;
}

export const getActiveShippingMethods = async (): Promise<ShippingMethod[]> => {
  return apiGet<ShippingMethod[]>('/api/shipping-methods');
};

export const calculateShippingCharge = async (
  subtotal: number,
  methodId?: number,
  code?: string
): Promise<ShippingCalculation> => {
  const params = new URLSearchParams();
  params.append('subtotal', subtotal.toString());
  if (methodId) params.append('methodId', methodId.toString());
  if (code) params.append('code', code);
  return apiGet<ShippingCalculation>(`/api/shipping-methods/calculate?${params.toString()}`);
};

export const getAdminShippingMethods = async (): Promise<ShippingMethod[]> => {
  return apiGet<ShippingMethod[]>('/api/admin/shipping-methods');
};

export const createShippingMethod = async (data: ShippingMethodRequest): Promise<ShippingMethod> => {
  return apiPost<ShippingMethod>('/api/admin/shipping-methods', data);
};

export const updateShippingMethod = async (id: number, data: ShippingMethodRequest): Promise<ShippingMethod> => {
  return apiPut<ShippingMethod>(`/api/admin/shipping-methods/${id}`, data);
};

export const deleteShippingMethod = async (id: number): Promise<void> => {
  return apiDelete<void>(`/api/admin/shipping-methods/${id}`);
};
