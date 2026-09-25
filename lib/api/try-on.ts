import { apiGet, apiPost } from "./client";

export interface TryOnConfigResponse {
  configured: boolean;
  model: string;
}

export interface TryOnTokenRequest {
  productId?: number | string;
  productSlug?: string;
  selectedVariantSku?: string;
}

export interface TryOnTokenResponse {
  clientToken: string;
  expiresAt: string;
  model: string;
  garmentImageUrl: string;
  productName: string;
}

/**
 * Check if Decart Virtual Try-On is configured and available on the backend.
 */
export async function getTryOnConfig(): Promise<TryOnConfigResponse> {
  return apiGet<TryOnConfigResponse>("/api/try-on/config");
}

/**
 * Acquire an ephemeral, short-lived client token from the backend to initiate
 * a secure WebRTC try-on session directly with Decart Lucy VTON.
 */
export async function getTryOnToken(payload: TryOnTokenRequest): Promise<TryOnTokenResponse> {
  return apiPost<TryOnTokenResponse>("/api/try-on/token", payload);
}
