import { apiGet, apiPost, buildQueryString } from "./client";

export interface OrderItem {
  id: number;
  variantId?: number;
  productId?: number;
  productSlug?: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  sizeSnapshot: string;
  colorSnapshot: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}


export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  items: OrderItem[];
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: "PENDING" | "PENDING_PAYMENT" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED" | "PAYMENT_FAILED";
  paymentStatus: "PENDING" | "AUTHORIZED" | "CAPTURED" | "PAID" | "FAILED" | "REFUNDED";
  shippingAddressSnapshot?: string;
  shipmentTrackingNumber?: string;
  carrierName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  addressId?: number;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  shippingMethodId?: number;
  shippingMethodCode?: string;
  couponCode?: string;
  sellerCode?: string;
}

export interface CheckoutResponse {
  order: Order;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
}

export interface PagedOrdersResponse {
  data?: Order[];
  content?: Order[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export async function checkoutOrder(data: CreateOrderData): Promise<CheckoutResponse> {
  return apiPost<CheckoutResponse>("/api/orders", data);
}

export async function getOrders(page = 0, size = 10): Promise<PagedOrdersResponse> {
  const query = buildQueryString({ page, size });
  return apiGet<PagedOrdersResponse>(`/api/orders${query}`);
}

export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  return apiGet<Order>(`/api/orders/${orderNumber}`);
}

export async function cancelOrder(orderNumber: string): Promise<Order> {
  return apiPost<Order>(`/api/orders/${orderNumber}/cancel`);
}
