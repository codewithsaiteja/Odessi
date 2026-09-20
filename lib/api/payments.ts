import { apiPost } from "./client";
import { Order } from "./orders";

export interface VerifyPaymentData {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export async function verifyPayment(data: VerifyPaymentData): Promise<Order> {
  return apiPost<Order>("/api/payments/verify", data);
}
