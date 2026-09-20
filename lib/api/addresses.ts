import { apiGet, apiPost, apiPut, apiDelete } from "./client";

export interface Address {
  id: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAddressData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateAddressData {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export async function getAddresses(): Promise<Address[]> {
  return apiGet<Address[]>("/api/addresses");
}

export async function createAddress(data: CreateAddressData): Promise<Address> {
  return apiPost<Address>("/api/addresses", data);
}

export async function updateAddress(id: number, data: UpdateAddressData): Promise<Address> {
  return apiPut<Address>(`/api/addresses/${id}`, data);
}

export async function deleteAddress(id: number): Promise<void> {
  return apiDelete(`/api/addresses/${id}`);
}

export async function setDefaultAddress(id: number): Promise<Address> {
  return apiPut<Address>(`/api/addresses/${id}`, { isDefault: true });
}
