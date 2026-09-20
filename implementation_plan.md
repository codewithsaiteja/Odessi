# Phase 5 Implementation Plan — Checkout, Orders, Inventory & Razorpay

**Project**: Odessi.tfi E-Commerce Platform  
**Version**: Phase 5  
**Date**: 2026-09-13  
**Status**: PENDING REVIEW — DO NOT IMPLEMENT YET

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Existing Functionality Analysis](#existing-functionality-analysis)
3. [Missing Functionality](#missing-functionality)
4. [Database Migrations Required](#database-migrations-required)
5. [API Contracts](#api-contracts)
6. [Backend Implementation](#backend-implementation)
7. [Frontend Implementation](#frontend-implementation)
8. [Razorpay Integration Architecture](#razorpay-integration-architecture)
9. [Inventory Transaction Strategy](#inventory-transaction-strategy)
10. [Payment & Order State Machine](#payment--order-state-machine)
11. [Security Considerations](#security-considerations)
12. [Failure Handling & Rollback](#failure-handling--rollback)
13. [Testing Strategy](#testing-strategy)
14. [Implementation Order](#implementation-order)

---

## Executive Summary

Phase 5 adds production-grade checkout, order management, inventory control, and Razorpay payment integration to Odessi.tfi.

**Key Discovery**: Phase 3 already created comprehensive Order, OrderItem, Payment, and Address entities with immutable snapshots, BigDecimal precision, and proper constraints. The database schema is **90% complete** for Phase 5 requirements.

**Critical Gaps**:
1. Order state machine needs `PENDING_PAYMENT` and `PAYMENT_PROCESSING` states
2. ProductVariant needs inventory transaction support (atomic updates)
3. Payment entity needs webhook idempotency tracking
4. No Razorpay integration exists
5. No checkout validation service
6. No order creation service
7. Frontend checkout page doesn't exist

**Philosophy**: Integrate, don't replace. All Phase 5 work extends existing entities and services.

---

## Existing Functionality Analysis

### ✅ Complete & Reusable

#### Backend Entities
| Entity | Status | Notes |
|--------|--------|-------|
| `Order` | ✅ Complete | Has all amounts (subtotal, shipping, discount, tax, total), BigDecimal types, `shippingAddressSnapshot` JSON, proper timestamps |
| `OrderItem` | ✅ Complete | Immutable snapshots (productName, SKU, size, color, unitPrice), variant reference, quantities, totals |
| `OrderStatus` | ⚠️ Needs enhancement | Has `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` — missing `PENDING_PAYMENT`, `PAYMENT_PROCESSING` |
| `Payment` | ✅ Complete | Has `providerOrderId`, `providerPaymentId`, amount, currency, status, order reference |
| `PaymentStatus` | ✅ Complete | `PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED` |
| `PaymentProvider` | ✅ Complete | `RAZORPAY` enum already defined |
| `Address` | ✅ Complete | All address fields, `isDefault` flag, user relationship |
| `ProductVariant` | ✅ Complete for products | Has `stockQuantity`, `price` (BigDecimal), `sku`, size/color, `active` flag, `isAvailable()` method |
| `Cart` | ✅ Complete | Authenticated cart with items, relationship to user |
| `CartItem` | ✅ Complete | Variant reference, quantity |

#### Database Schema (Flyway Migrations)
- ✅ `V4__create_orders.sql` — addresses, orders, order_items tables complete
- ✅ `V5__create_payments.sql` — payments table complete
- ✅ `V2__create_products.sql` — product_variants with stock_quantity
- ⚠️ Missing: webhook idempotency column, order status enum values

#### Repositories
- ✅ `OrderRepository` — pagination by user, order number lookup, eager fetch items, `countOrdersToday()` for order number generation
- ✅ `PaymentRepository` — find by order, find by provider order ID
- ✅ `ProductVariantRepository` — find by SKU, product, active status
- ✅ `AddressRepository` — find by user
- ✅ `CartRepository`, `CartItemRepository` — complete

#### Security & Auth
- ✅ JWT HttpOnly cookie authentication
- ✅ CSRF protection with XSRF-TOKEN
- ✅ `SecurityConfig` — `/api/orders/**` and `/api/addresses/**` protected, authenticated
- ✅ `AuthService.getCurrentUser()` — extracts authenticated user
- ✅ Role-based authorization (CUSTOMER, ADMIN)

#### Frontend
- ✅ `AuthContext` — user state, login, register, logout, `mergeCart` on login
- ✅ `CartContext` — server-authoritative cart, `fetchServerCart()`, add/remove/update, subtotal/shipping/total calculations
- ✅ `lib/api/client.ts` — centralized HTTP client, auto CSRF token, auto retry with refresh token on 401, credentials: include
- ✅ `ApiResponse<T>` wrapper handling
- ✅ Navbar with cart badge
- ✅ Cart drawer with line items

#### Existing DTOs
- ✅ `OrderResponse` — complete with all order fields
- ✅ `OrderItemResponse` — complete
- ✅ `AddressResponse` — complete
- ✅ `CartResponse` — complete
- ✅ `ApiResponse<T>` — standard wrapper

### ❌ Missing Functionality

#### Backend Services
- ❌ `CheckoutService` — validate cart, calculate totals, validate stock
- ❌ `OrderService` — create order, generate order number, fetch orders
- ❌ `PaymentService` interface — abstraction for payment providers
- ❌ `RazorpayPaymentService` — Razorpay API client
- ❌ `InventoryService` — atomic stock operations
- ❌ Order number generator (format: `ODR-20260913-00001`)

#### Backend Controllers
- ❌ `CheckoutController` — `/api/checkout/validate`
- ❌ `OrderController` — `/api/orders` (POST, GET list, GET by ID)
- ❌ `PaymentController` — `/api/payments/razorpay/*` (create, verify, webhook)

#### Frontend Pages
- ❌ `/checkout` page — address selection, order summary, place order
- ❌ `/account/orders` — order history
- ❌ `/orders/[orderNumber]` — order detail page

#### Frontend API Clients
- ❌ `lib/api/checkout.ts` — validate checkout
- ❌ `lib/api/orders.ts` — create order, fetch orders
- ❌ `lib/api/payments.ts` — Razorpay order creation, verification
- ❌ `lib/api/addresses.ts` — CRUD addresses (AddressController exists, client missing)

#### Razorpay Integration
- ❌ Razorpay Java SDK dependency
- ❌ Razorpay configuration in `application.yml`
- ❌ Razorpay signature verification
- ❌ Webhook endpoint with HMAC signature validation
- ❌ Idempotency handling

---

## Database Migrations Required

### V8__phase5_checkout_enhancements.sql

```sql
-- ══════════════════════════════════════════════════════════════
-- V8 — Phase 5 Checkout Enhancements
-- ══════════════════════════════════════════════════════════════

-- 1. Add PENDING_PAYMENT and PAYMENT_PROCESSING to OrderStatus enum
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_status;
ALTER TABLE orders ADD CONSTRAINT chk_orders_status 
  CHECK (status IN (
    'PENDING_PAYMENT',
    'PAYMENT_PROCESSING', 
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
  ));

-- 2. Add webhook idempotency tracking to payments
ALTER TABLE payments ADD COLUMN webhook_event_id VARCHAR(200);
CREATE INDEX idx_payments_webhook_event ON payments (webhook_event_id);

COMMENT ON COLUMN payments.webhook_event_id IS 'Razorpay webhook event ID for idempotency';

-- 3. Add inventory audit log table (optional but recommended for production)
CREATE TABLE inventory_transactions (
    id              BIGSERIAL PRIMARY KEY,
    variant_id      BIGINT       NOT NULL,
    order_id        BIGINT,
    transaction_type VARCHAR(30) NOT NULL,
    quantity_delta  INT          NOT NULL,
    stock_before    INT          NOT NULL,
    stock_after     INT          NOT NULL,
    reason          VARCHAR(500),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_inventory_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_inventory_order   FOREIGN KEY (order_id)   REFERENCES orders(id),
    CONSTRAINT chk_inventory_type   CHECK (transaction_type IN ('ORDER_PLACED', 'ORDER_CANCELLED', 'RESTOCK', 'ADJUSTMENT'))
);

CREATE INDEX idx_inventory_variant ON inventory_transactions (variant_id);
CREATE INDEX idx_inventory_order   ON inventory_transactions (order_id);
CREATE INDEX idx_inventory_created ON inventory_transactions (created_at DESC);

COMMENT ON TABLE inventory_transactions IS 'Audit trail for all inventory changes';
```

**Rationale**:
- New order states support payment-pending flow
- `webhook_event_id` prevents duplicate webhook processing
- `inventory_transactions` provides full audit trail (critical for investigating overselling bugs)

---

## API Contracts

### Checkout Endpoints

#### POST /api/checkout/validate
Validate cart contents, stock, and calculate authoritative totals.

**Request**: None (reads from authenticated user's cart)

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "issues": [],
    "cartSummary": {
      "items": [
        {
          "variantId": 123,
          "productName": "Dark Verse Tee",
          "size": "M",
          "color": "Washed Black",
          "quantity": 2,
          "unitPrice": 2499.00,
          "lineTotal": 4998.00,
          "available": true,
          "stockQuantity": 15
        }
      ],
      "subtotal": 4998.00,
      "shipping": 0.00,
      "discount": 0.00,
      "tax": 0.00,
      "total": 4998.00,
      "currency": "INR"
    }
  },
  "timestamp": "2026-09-13T10:30:00Z"
}
```

**Issues** (when `valid: false`):
```json
{
  "valid": false,
  "issues": [
    {
      "type": "INSUFFICIENT_STOCK",
      "variantId": 123,
      "requested": 5,
      "available": 2,
      "message": "Only 2 units available"
    },
    {
      "type": "VARIANT_INACTIVE",
      "variantId": 456,
      "message": "This product is no longer available"
    }
  ]
}
```

**Error Codes**:
- `400` — Cart empty
- `401` — Not authenticated

---

### Order Endpoints

#### POST /api/orders
Create order from current cart. Triggers payment flow.

**Request**:
```json
{
  "addressId": 5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 101,
      "orderNumber": "ODR-20260913-00001",
      "userId": 7,
      "items": [...],
      "subtotal": 4998.00,
      "shippingAmount": 0.00,
      "discountAmount": 0.00,
      "taxAmount": 0.00,
      "totalAmount": 4998.00,
      "currency": "INR",
      "status": "PENDING_PAYMENT",
      "paymentStatus": "PENDING",
      "shippingAddressSnapshot": "{...}",
      "createdAt": "2026-09-13T10:32:00Z",
      "updatedAt": "2026-09-13T10:32:00Z"
    },
    "payment": {
      "id": 42,
      "orderId": 101,
      "provider": "RAZORPAY",
      "providerOrderId": "order_NXsFt3kj8sK9dL",
      "amount": 4998.00,
      "currency": "INR",
      "status": "PENDING"
    },
    "razorpayCheckoutData": {
      "key": "rzp_live_xxxxx",
      "orderId": "order_NXsFt3kj8sK9dL",
      "amount": 499800,
      "currency": "INR",
      "name": "Odessi",
      "description": "Order ODR-20260913-00001",
      "prefill": {
        "name": "John Doe",
        "email": "john@example.com",
        "contact": "+919876543210"
      }
    }
  },
  "timestamp": "2026-09-13T10:32:00Z"
}
```

**Flow**:
1. Backend validates cart
2. Creates Order (status: `PENDING_PAYMENT`)
3. Creates Payment record
4. Calls Razorpay create order API
5. Returns order + payment + Razorpay checkout data to frontend
6. Frontend opens Razorpay checkout
7. User completes payment
8. Razorpay callback → backend verification
9. Order status → `CONFIRMED`, inventory deducted
10. Cart cleared

**Error Codes**:
- `400` — Cart empty, validation failed, address not found, address doesn't belong to user
- `401` — Not authenticated
- `409` — Insufficient stock (concurrent purchase)
- `500` — Razorpay API failure

---

#### GET /api/orders
Fetch authenticated user's order history (paginated).

**Query Params**:
- `page` (default: 0)
- `size` (default: 20)
- `status` (optional filter)

**Response**:
```json
{
  "success": true,
  "data": {
    "content": [ /* OrderResponse[] */ ],
    "page": 0,
    "size": 20,
    "totalElements": 3,
    "totalPages": 1
  },
  "timestamp": "2026-09-13T10:35:00Z"
}
```

**Security**: Only returns orders where `order.userId = currentUser.id`

---

#### GET /api/orders/{orderNumber}
Fetch single order by order number.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 101,
    "orderNumber": "ODR-20260913-00001",
    "userId": 7,
    "items": [
      {
        "id": 201,
        "variantId": 123,
        "productNameSnapshot": "Dark Verse Tee",
        "skuSnapshot": "DV-TEE-M-BLK",
        "sizeSnapshot": "M",
        "colorSnapshot": "Washed Black",
        "unitPrice": 2499.00,
        "quantity": 2,
        "totalPrice": 4998.00
      }
    ],
    "subtotal": 4998.00,
    "shippingAmount": 0.00,
    "discountAmount": 0.00,
    "taxAmount": 0.00,
    "totalAmount": 4998.00,
    "currency": "INR",
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "shippingAddressSnapshot": "{...}",
    "createdAt": "2026-09-13T10:32:00Z",
    "updatedAt": "2026-09-13T10:34:00Z"
  },
  "timestamp": "2026-09-13T10:36:00Z"
}
```

**Security**: Returns 404 if order doesn't belong to current user.

---

### Payment Endpoints

#### POST /api/payments/razorpay/verify
Verify Razorpay payment signature after frontend callback.

**Request**:
```json
{
  "razorpayOrderId": "order_NXsFt3kj8sK9dL",
  "razorpayPaymentId": "pay_Abc123xyz456",
  "razorpaySignature": "f3d9c8b2a1e4..."
}
```

**Response** (success):
```json
{
  "success": true,
  "data": {
    "verified": true,
    "order": { /* OrderResponse */ }
  },
  "timestamp": "2026-09-13T10:34:00Z"
}
```

**Response** (failure):
```json
{
  "success": false,
  "error": "SIGNATURE_VERIFICATION_FAILED",
  "message": "Invalid payment signature",
  "timestamp": "2026-09-13T10:34:00Z"
}
```

**Flow**:
1. Frontend calls after Razorpay checkout success callback
2. Backend reconstructs `generated_signature = HMAC-SHA256(orderId|paymentId, secret)`
3. Compares with `razorpaySignature`
4. If match: updates order status → `CONFIRMED`, payment status → `PAID`, deducts inventory
5. Returns verified order

**Security**:
- CSRF protected
- Authenticated
- Ownership validated (payment.order.userId == currentUser.id)

---

#### POST /api/payments/razorpay/webhook
Razorpay webhook receiver (asynchronous payment confirmation).

**Headers**:
- `X-Razorpay-Signature` — HMAC SHA256 of request body

**Request**:
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_Abc123xyz456",
        "order_id": "order_NXsFt3kj8sK9dL",
        "status": "captured",
        "amount": 499800
      }
    }
  }
}
```

**Response**:
```json
{ "status": "ok" }
```

**Flow**:
1. Validate webhook signature
2. Check `webhook_event_id` for idempotency (skip if already processed)
3. Find payment by `providerOrderId`
4. Update payment status
5. Update order status
6. Deduct inventory (if not already done)
7. Store `webhook_event_id`

**Security**:
- **NO CSRF** (external webhook)
- **NO AUTH** (Razorpay server-to-server)
- HMAC signature validation REQUIRED
- Idempotency via `webhook_event_id`

---

## Backend Implementation

### 1. Add Razorpay Dependency

**File**: `backend/odessi-api/pom.xml`

Add after other dependencies:

```xml
<!-- ── Razorpay Java SDK ── -->
<dependency>
    <groupId>com.razorpay</groupId>
    <artifactId>razorpay-java</artifactId>
    <version>1.4.6</version>
</dependency>
```

---

### 2. Update OrderStatus Enum

**File**: `backend/odessi-api/src/main/java/com/odessi/api/entity/OrderStatus.java`

```java
public enum OrderStatus {
    PENDING_PAYMENT,      // ← NEW: Order created, awaiting payment
    PAYMENT_PROCESSING,   // ← NEW: Payment initiated
    PENDING,              // Existing: Payment received, order confirmed
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
```

---

### 3. Update Payment Entity

**File**: `backend/odessi-api/src/main/java/com/odessi/api/entity/Payment.java`

Add field:

```java
/** Razorpay webhook event ID for idempotency. */
@Column(name = "webhook_event_id", length = 200)
private String webhookEventId;

// Add getter/setter
```

---

### 4. Create InventoryTransaction Entity

**File**: `backend/odessi-api/src/main/java/com/odessi/api/entity/InventoryTransaction.java`

```java
package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 30)
    private TransactionType transactionType;

    @Column(name = "quantity_delta", nullable = false)
    private int quantityDelta;

    @Column(name = "stock_before", nullable = false)
    private int stockBefore;

    @Column(name = "stock_after", nullable = false)
    private int stockAfter;

    @Column(name = "reason", length = 500)
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Getters/setters omitted for brevity
}
```

**File**: `backend/odessi-api/src/main/java/com/odessi/api/entity/TransactionType.java`

```java
package com.odessi.api.entity;

public enum TransactionType {
    ORDER_PLACED,
    ORDER_CANCELLED,
    RESTOCK,
    ADJUSTMENT
}
```

---

### 5. Create DTOs

#### CheckoutValidationResponse.java

**File**: `backend/odessi-api/src/main/java/com/odessi/api/dto/response/CheckoutValidationResponse.java`

```java
package com.odessi.api.dto.response;

import java.util.List;

public record CheckoutValidationResponse(
    boolean valid,
    List<ValidationIssue> issues,
    CartSummaryResponse cartSummary
) {}
```

#### ValidationIssue.java

```java
package com.odessi.api.dto.response;

public record ValidationIssue(
    String type,            // INSUFFICIENT_STOCK, VARIANT_INACTIVE, PRICE_CHANGED
    Long variantId,
    String message,
    Integer requested,      // for INSUFFICIENT_STOCK
    Integer available       // for INSUFFICIENT_STOCK
) {}
```

#### CartSummaryResponse.java

```java
package com.odessi.api.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CartSummaryResponse(
    List<CartSummaryItemResponse> items,
    BigDecimal subtotal,
    BigDecimal shipping,
    BigDecimal discount,
    BigDecimal tax,
    BigDecimal total,
    String currency
) {}
```

#### CartSummaryItemResponse.java

```java
package com.odessi.api.dto.response;

import java.math.BigDecimal;

public record CartSummaryItemResponse(
    Long variantId,
    String productName,
    String size,
    String color,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal,
    boolean available,
    int stockQuantity
) {}
```

#### CreateOrderRequest.java

```java
package com.odessi.api.dto.request;

import jakarta.validation.constraints.NotNull;

public record CreateOrderRequest(
    @NotNull(message = "Address ID is required")
    Long addressId
) {}
```

#### CreateOrderResponse.java

```java
package com.odessi.api.dto.response;

public record CreateOrderResponse(
    OrderResponse order,
    PaymentResponse payment,
    RazorpayCheckoutData razorpayCheckoutData
) {}
```

#### PaymentResponse.java

```java
package com.odessi.api.dto.response;

import com.odessi.api.entity.PaymentProvider;
import com.odessi.api.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
    Long id,
    Long orderId,
    PaymentProvider provider,
    String providerOrderId,
    String providerPaymentId,
    BigDecimal amount,
    String currency,
    PaymentStatus status,
    Instant createdAt,
    Instant updatedAt
) {}
```

#### RazorpayCheckoutData.java

```java
package com.odessi.api.dto.response;

import java.util.Map;

public record RazorpayCheckoutData(
    String key,             // Razorpay key_id (public)
    String orderId,         // Razorpay order ID
    int amount,             // Amount in paise (₹49.98 = 4998)
    String currency,
    String name,            // "Odessi"
    String description,     // "Order ODR-20260913-00001"
    Map<String, String> prefill  // name, email, contact
) {}
```

#### VerifyPaymentRequest.java

```java
package com.odessi.api.dto.request;

import jakarta.validation.constraints.NotBlank;

public record VerifyPaymentRequest(
    @NotBlank String razorpayOrderId,
    @NotBlank String razorpayPaymentId,
    @NotBlank String razorpaySignature
) {}
```

#### VerifyPaymentResponse.java

```java
package com.odessi.api.dto.response;

public record VerifyPaymentResponse(
    boolean verified,
    OrderResponse order
) {}
```

---

### 6. Create Repositories

#### InventoryTransactionRepository.java

```java
package com.odessi.api.repository;

import com.odessi.api.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findByVariantIdOrderByCreatedAtDesc(Long variantId);
}
```

---

### 7. Create Services

#### CheckoutService.java (interface)

```java
package com.odessi.api.service;

import com.odessi.api.dto.response.CheckoutValidationResponse;

public interface CheckoutService {
    CheckoutValidationResponse validateCheckout(Long userId);
}
```

#### OrderService.java (interface)

```java
package com.odessi.api.service;

import com.odessi.api.dto.request.CreateOrderRequest;
import com.odessi.api.dto.response.CreateOrderResponse;
import com.odessi.api.dto.response.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
    CreateOrderResponse createOrder(Long userId, CreateOrderRequest request);
    Page<OrderResponse> getUserOrders(Long userId, Pageable pageable);
    OrderResponse getOrderByNumber(Long userId, String orderNumber);
    String generateOrderNumber();
}
```

#### PaymentService.java (interface)

```java
package com.odessi.api.service;

import com.odessi.api.dto.request.VerifyPaymentRequest;
import com.odessi.api.dto.response.RazorpayCheckoutData;
import com.odessi.api.dto.response.VerifyPaymentResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.Payment;

public interface PaymentService {
    Payment createRazorpayOrder(Order order);
    RazorpayCheckoutData getRazorpayCheckoutData(Payment payment, Order order);
    VerifyPaymentResponse verifyPayment(Long userId, VerifyPaymentRequest request);
    void handleWebhook(String signature, String payload);
}
```

#### InventoryService.java (interface)

```java
package com.odessi.api.service;

import com.odessi.api.entity.Order;
import com.odessi.api.entity.ProductVariant;

public interface InventoryService {
    boolean checkStockAvailability(Long variantId, int quantity);
    void reserveStock(Order order);
    void releaseStock(Order order);
    void recordTransaction(ProductVariant variant, Order order, String type, int delta, String reason);
}
```

---

### 8. Implement Services

Implementation files (detailed pseudo-code provided in review; full implementation after approval):

- `CheckoutServiceImpl.java` — validates cart items, checks stock, calculates totals
- `OrderServiceImpl.java` — creates order with snapshots, generates order numbers (format: `ODR-YYYYMMDD-NNNNN`), fetches orders
- `PaymentServiceImpl.java` — Razorpay API integration, signature verification, webhook handling
- `InventoryServiceImpl.java` — atomic stock updates with `@Lock(LockModeType.PESSIMISTIC_WRITE)`, transaction logging

**Key Implementation Notes**:
- All monetary calculations use `BigDecimal`
- Order snapshots are JSON (using Jackson `ObjectMapper`)
- Stock updates are pessimistically locked to prevent race conditions
- Webhook idempotency uses `payment.webhookEventId`

---

### 9. Create Controllers

#### CheckoutController.java

```java
@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {
    // POST /api/checkout/validate
}
```

#### OrderController.java

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    // POST   /api/orders
    // GET    /api/orders
    // GET    /api/orders/{orderNumber}
}
```

#### PaymentController.java

```java
@RestController
@RequestMapping("/api/payments/razorpay")
public class PaymentController {
    // POST /api/payments/razorpay/verify
    // POST /api/payments/razorpay/webhook (CSRF exempt)
}
```

---

### 10. Update SecurityConfig

**File**: `backend/odessi-api/src/main/java/com/odessi/api/config/SecurityConfig.java`

Add webhook CSRF exemption:

```java
.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    .csrfTokenRequestHandler(requestHandler)
    .ignoringRequestMatchers(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/payments/razorpay/webhook"  // ← NEW: Razorpay webhook
    )
)
```

Add checkout endpoint protection:

```java
.requestMatchers("/api/checkout/**").authenticated()
.requestMatchers("/api/payments/**").authenticated()  // except webhook (handled by ignoringRequestMatchers)
```

---

### 11. Add Razorpay Configuration

**File**: `backend/odessi-api/src/main/resources/application.yml`

```yaml
razorpay:
  key-id: ${RAZORPAY_KEY_ID}
  key-secret: ${RAZORPAY_KEY_SECRET}
  webhook-secret: ${RAZORPAY_WEBHOOK_SECRET}
```

**File**: `backend/odessi-api/.env.example`

Add:

```bash
# ── Razorpay (Phase 5) ────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**File**: `backend/odessi-api/src/main/java/com/odessi/api/config/RazorpayConfig.java`

```java
package com.odessi.api.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        return new RazorpayClient(keyId, keySecret);
    }
}
```

---

## Frontend Implementation

### 1. Create Address API Client

**File**: `lib/api/addresses.ts`

```typescript
import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

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
}

export async function getAddresses(): Promise<Address[]> {
  return apiGet<Address[]>("/api/addresses");
}

export async function createAddress(data: Omit<Address, "id">): Promise<Address> {
  return apiPost<Address>("/api/addresses", data);
}

export async function updateAddress(id: number, data: Partial<Address>): Promise<Address> {
  return apiPatch<Address>(`/api/addresses/${id}`, data);
}

export async function deleteAddress(id: number): Promise<void> {
  return apiDelete(`/api/addresses/${id}`);
}
```

---

### 2. Create Checkout API Client

**File**: `lib/api/checkout.ts`

```typescript
import { apiGet } from "./client";

export interface CheckoutValidation {
  valid: boolean;
  issues: ValidationIssue[];
  cartSummary: CartSummary;
}

export interface ValidationIssue {
  type: "INSUFFICIENT_STOCK" | "VARIANT_INACTIVE" | "PRICE_CHANGED";
  variantId: number;
  message: string;
  requested?: number;
  available?: number;
}

export interface CartSummary {
  items: CartSummaryItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

export interface CartSummaryItem {
  variantId: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  available: boolean;
  stockQuantity: number;
}

export async function validateCheckout(): Promise<CheckoutValidation> {
  return apiGet<CheckoutValidation>("/api/checkout/validate");
}
```

---

### 3. Create Orders API Client

**File**: `lib/api/orders.ts`

```typescript
import { apiGet, apiPost } from "./client";

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
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddressSnapshot: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  variantId: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  sizeSnapshot: string;
  colorSnapshot: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_PROCESSING"
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";

export interface CreateOrderResponse {
  order: Order;
  payment: Payment;
  razorpayCheckoutData: RazorpayCheckoutData;
}

export interface Payment {
  id: number;
  orderId: number;
  provider: "RAZORPAY";
  providerOrderId: string;
  providerPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

export interface RazorpayCheckoutData {
  key: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export async function createOrder(addressId: number): Promise<CreateOrderResponse> {
  return apiPost<CreateOrderResponse>("/api/orders", { addressId });
}

export async function getOrders(page = 0, size = 20): Promise<PaginatedResponse<Order>> {
  return apiGet<PaginatedResponse<Order>>(`/api/orders?page=${page}&size=${size}`);
}

export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  return apiGet<Order>(`/api/orders/${orderNumber}`);
}
```

---

### 4. Create Payments API Client

**File**: `lib/api/payments.ts`

```typescript
import { apiPost } from "./client";
import type { Order } from "./orders";

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  order: Order;
}

export async function verifyPayment(data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
  return apiPost<VerifyPaymentResponse>("/api/payments/razorpay/verify", data);
}
```

---

### 5. Create Checkout Page

**File**: `app/checkout/page.tsx`

Key sections:
- Address selection (fetch from `/api/addresses`, show default first)
- Add/edit address modal
- Order summary (fetch from `/api/checkout/validate`)
- Stock validation errors display
- Place Order button → `createOrder()` → opens Razorpay checkout
- Razorpay success handler → `verifyPayment()` → redirect to order confirmation

**Pseudo-structure**:

```tsx
"use client";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [validation, setValidation] = useState<CheckoutValidation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) router.push("/login?redirect=/checkout");
    loadAddresses();
    validateCheckout();
  }, [user]);

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const response = await createOrder(selectedAddressId!);
      openRazorpayCheckout(response);
    } catch (error) {
      // Handle error
    } finally {
      setIsProcessing(false);
    }
  };

  const openRazorpayCheckout = (response: CreateOrderResponse) => {
    const options = {
      key: response.razorpayCheckoutData.key,
      amount: response.razorpayCheckoutData.amount,
      currency: response.razorpayCheckoutData.currency,
      name: response.razorpayCheckoutData.name,
      description: response.razorpayCheckoutData.description,
      order_id: response.razorpayCheckoutData.orderId,
      prefill: response.razorpayCheckoutData.prefill,
      handler: async (razorpayResponse: any) => {
        // Payment success callback
        await handlePaymentSuccess(razorpayResponse, response.order.orderNumber);
      },
      modal: {
        ondismiss: () => {
          // User closed modal — order still exists in PENDING_PAYMENT
          router.push(`/orders/${response.order.orderNumber}`);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handlePaymentSuccess = async (razorpayResponse: any, orderNumber: string) => {
    try {
      const verifyResult = await verifyPayment({
        razorpayOrderId: razorpayResponse.razorpay_order_id,
        razorpayPaymentId: razorpayResponse.razorpay_payment_id,
        razorpaySignature: razorpayResponse.razorpay_signature
      });

      if (verifyResult.verified) {
        clearCart(); // Clear cart AFTER backend confirmation
        router.push(`/orders/${orderNumber}?success=true`);
      }
    } catch (error) {
      // Verification failed
      router.push(`/orders/${orderNumber}?error=verification_failed`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1>Checkout</h1>
      {/* Address selection */}
      {/* Order summary */}
      {/* Place Order button */}
    </div>
  );
}
```

**Dependencies**: Add Razorpay script to `app/layout.tsx`:

```tsx
<Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
```

---

### 6. Create Order History Page

**File**: `app/account/orders/page.tsx`

- Fetch `/api/orders`
- Display order cards with order number, date, status, total
- Link to `/orders/[orderNumber]`

---

### 7. Create Order Detail Page

**File**: `app/orders/[orderNumber]/page.tsx`

- Fetch `/api/orders/[orderNumber]`
- Display order items, address snapshot, payment status, order status
- Show success banner if `?success=true` in URL

---

### 8. Add Razorpay TypeScript Types

**File**: `types/razorpay.d.ts`

```typescript
declare global {
  interface Window {
    Razorpay: any;
  }
}

export {};
```

---

## Razorpay Integration Architecture

### Flow Diagram

```
┌─────────────┐                ┌──────────────┐                ┌────────────┐
│   Next.js   │                │ Spring Boot  │                │  Razorpay  │
│   Frontend  │                │   Backend    │                │    API     │
└──────┬──────┘                └──────┬───────┘                └─────┬──────┘
       │                              │                              │
       │  1. POST /api/orders         │                              │
       │  { addressId: 5 }            │                              │
       │─────────────────────────────>│                              │
       │                              │  2. Validate cart & stock    │
       │                              │                              │
       │                              │  3. Create Order             │
       │                              │     (PENDING_PAYMENT)        │
       │                              │                              │
       │                              │  4. POST /orders             │
       │                              │  (create Razorpay order)     │
       │                              │─────────────────────────────>│
       │                              │                              │
       │                              │  5. Return order_id          │
       │                              │<─────────────────────────────│
       │                              │                              │
       │                              │  6. Save providerOrderId     │
       │                              │                              │
       │  7. Return CreateOrderResponse                             │
       │     (order, payment, razorpayCheckoutData)                 │
       │<─────────────────────────────│                              │
       │                              │                              │
       │  8. Open Razorpay checkout   │                              │
       │     (client-side SDK)        │                              │
       │──────────────────────────────────────────────────────────>│
       │                              │                              │
       │  9. User completes payment   │                              │
       │                              │                              │
       │  10. Razorpay callback       │                              │
       │     { orderId, paymentId,    │                              │
       │       signature }            │                              │
       │<──────────────────────────────────────────────────────────│
       │                              │                              │
       │  11. POST /api/payments/razorpay/verify                    │
       │     { razorpayOrderId,       │                              │
       │       razorpayPaymentId,     │                              │
       │       razorpaySignature }    │                              │
       │─────────────────────────────>│                              │
       │                              │  12. Verify signature        │
       │                              │      (HMAC-SHA256)           │
       │                              │                              │
       │                              │  13. Update order            │
       │                              │      (CONFIRMED)             │
       │                              │                              │
       │                              │  14. Update payment          │
       │                              │      (PAID)                  │
       │                              │                              │
       │                              │  15. Deduct inventory        │
       │                              │      (atomic)                │
       │                              │                              │
       │  16. Return verified order   │                              │
       │<─────────────────────────────│                              │
       │                              │                              │
       │  17. Clear cart              │                              │
       │  18. Redirect to order page  │                              │
       │                              │                              │
       │                              │  Webhook (async)             │
       │                              │<─────────────────────────────│
       │                              │  19. Validate HMAC           │
       │                              │  20. Check idempotency       │
       │                              │  21. Update if needed        │
       │                              │                              │
```

### Key Security Points

1. **Never expose `RAZORPAY_KEY_SECRET` to frontend** — only `key_id` is public
2. **Backend creates Razorpay order** — amount is authoritative from server
3. **Signature verification is mandatory** — prevents payment spoofing
4. **Webhook signature validation** — prevents fake webhooks
5. **Idempotency via `webhook_event_id`** — prevents double-processing
6. **Ownership validation** — user can only verify their own payments

---

## Inventory Transaction Strategy

### Concurrency Control

**Problem**: Two users checkout the last item simultaneously.

**Solution**: Pessimistic locking + atomic updates.

#### InventoryServiceImpl Pseudocode

```java
@Transactional
public void reserveStock(Order order) {
    for (OrderItem item : order.getItems()) {
        ProductVariant variant = variantRepo.findByIdWithLock(item.getVariantId());
        
        int stockBefore = variant.getStockQuantity();
        int requested = item.getQuantity();
        
        if (stockBefore < requested) {
            throw new InsufficientStockException(
                "Only " + stockBefore + " units available for " + variant.getSku()
            );
        }
        
        int stockAfter = stockBefore - requested;
        variant.setStockQuantity(stockAfter);
        variantRepo.save(variant);
        
        // Audit log
        recordTransaction(variant, order, "ORDER_PLACED", -requested, 
            "Order " + order.getOrderNumber());
    }
}

@Query("SELECT v FROM ProductVariant v WHERE v.id = :id")
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<ProductVariant> findByIdWithLock(@Param("id") Long id);
```

**Flow**:
1. Order creation → status `PENDING_PAYMENT` → **NO inventory deduction**
2. Payment verification success → **deduct inventory** (pessimistic lock)
3. If payment fails → order stays `PENDING_PAYMENT`, inventory unchanged
4. Order cancellation → **restore inventory**

**Why not reserve on order creation?**
- Razorpay payment can be abandoned (user closes modal)
- Stock would be locked indefinitely
- Better: only deduct when payment is **confirmed**

---

## Payment & Order State Machine

### Order Lifecycle

```
┌─────────────────┐
│  PENDING_PAYMENT│  ← Order created, awaiting payment
└────────┬────────┘
         │
         │ Payment initiated
         ▼
┌──────────────────────┐
│ PAYMENT_PROCESSING   │  ← Razorpay checkout open
└────────┬─────────────┘
         │
         │ Payment success + verified
         ▼
┌─────────────┐
│  CONFIRMED  │  ← Payment captured, inventory deducted
└──────┬──────┘
       │
       │ Admin starts processing
       ▼
┌────────────┐
│ PROCESSING │
└──────┬─────┘
       │
       │ Admin dispatches
       ▼
┌─────────┐
│ SHIPPED │
└────┬────┘
     │
     │ Delivery confirmed
     ▼
┌───────────┐
│ DELIVERED │
└───────────┘

       │ User/Admin cancels
       ▼
┌───────────┐
│ CANCELLED │  ← Inventory restored if order was CONFIRMED
└───────────┘
```

### Payment Lifecycle

```
┌─────────┐
│ PENDING │  ← Payment created
└────┬────┘
     │
     │ Razorpay order created
     ▼
┌─────────────┐
│ AUTHORIZED  │  ← Payment authorized (optional state)
└──────┬──────┘
       │
       │ Payment captured
       ▼
┌──────┐
│ PAID │  ← Payment successful
└──────┘

     │ Payment failed
     ▼
┌─────────┐
│ FAILED  │  ← Payment failed
└─────────┘

     │ Refund issued
     ▼
┌──────────┐
│ REFUNDED │  ← Payment refunded
└──────────┘
```

### State Transition Rules

| From | To | Trigger | Actions |
|------|-----|---------|---------|
| `PENDING_PAYMENT` | `PAYMENT_PROCESSING` | Razorpay checkout opened | None |
| `PAYMENT_PROCESSING` | `CONFIRMED` | Payment verified | Deduct inventory, clear cart |
| `PAYMENT_PROCESSING` | `PENDING_PAYMENT` | Payment failed | None |
| `CONFIRMED` | `PROCESSING` | Admin action | None |
| `PROCESSING` | `SHIPPED` | Admin action | Send tracking email |
| `SHIPPED` | `DELIVERED` | Delivery confirmed | None |
| `CONFIRMED`/`PROCESSING` | `CANCELLED` | User/Admin cancellation | Restore inventory, initiate refund |

---

## Security Considerations

### Backend

1. **Never trust frontend values**
   - Cart totals, prices, stock levels are **read-only** from backend
   - Backend recalculates everything from database

2. **Ownership validation**
   - Every endpoint checks `order.userId == currentUser.id`
   - Address selection validates `address.userId == currentUser.id`

3. **Razorpay signature verification**
   ```java
   String generatedSignature = HmacUtils.hmacSha256Hex(
       razorpayKeySecret,
       razorpayOrderId + "|" + razorpayPaymentId
   );
   if (!generatedSignature.equals(razorpaySignature)) {
       throw new PaymentVerificationException();
   }
   ```

4. **Webhook signature validation**
   ```java
   String computedSignature = HmacUtils.hmacSha256Hex(
       webhookSecret,
       requestBody
   );
   if (!computedSignature.equals(xRazorpaySignature)) {
       throw new WebhookSecurityException();
   }
   ```

5. **Idempotency**
   - Check `payment.webhookEventId` before processing webhook
   - Skip if already processed

6. **No logging of secrets**
   - Never log JWT tokens
   - Never log Razorpay secrets
   - Mask sensitive payment data in logs

7. **CSRF exemption only for webhook**
   - `/api/payments/razorpay/webhook` is CSRF-exempt (external POST)
   - Signature validation replaces CSRF protection

### Frontend

1. **Razorpay script integrity**
   - Use official CDN: `https://checkout.razorpay.com/v1/checkout.js`
   - Consider SRI hash in production

2. **Never trust payment success callback alone**
   - Always call backend `/api/payments/razorpay/verify`
   - Only clear cart after backend confirms

3. **Handle all failure modes**
   - Payment cancelled → redirect to order page (order still exists)
   - Verification failed → show error, don't clear cart
   - Network failure → order already created, user can retry payment

---

## Failure Handling & Rollback

### Scenario Matrix

| Failure | Impact | Handling |
|---------|--------|----------|
| Empty cart | Order creation fails | Return `400 BAD_REQUEST` before creating order |
| Product removed | Cart validation fails | Return validation errors with `VARIANT_INACTIVE` |
| Variant removed | Cart validation fails | Same as above |
| Insufficient stock | Order creation fails | Return `409 CONFLICT` with available stock |
| Price changed | Order uses current price | No error — order reflects current price (user sees in checkout validation) |
| Payment cancelled | Order stays `PENDING_PAYMENT` | User can retry payment, or cancel order manually |
| Payment failed | Order stays `PENDING_PAYMENT`, payment status `FAILED` | User can retry with new payment (create new order) |
| Signature verification failure | Payment not confirmed | Return `403 FORBIDDEN`, order stays `PENDING_PAYMENT` |
| Duplicate webhook | No-op | Check `webhookEventId`, skip if already processed |
| Webhook arrives before frontend callback | Order already confirmed | Frontend verification returns already-confirmed order |
| Frontend closes during payment | Order created but not confirmed | User can view order in order history, retry payment (future enhancement: payment link) |
| Network failure during order creation | Transaction rolled back | User retries, new order created |
| Order creation succeeds, payment API fails | Order exists in `PENDING_PAYMENT` | User sees order, can retry payment (future enhancement) |
| Payment succeeds, frontend never receives callback | Webhook handles it | Order confirmed via webhook, user sees confirmation in order history |

### Database Consistency Guarantees

1. **Order + Payment creation is atomic**
   - Both in same `@Transactional` method
   - If Razorpay API fails, transaction rolls back

2. **Inventory deduction is atomic**
   - Pessimistic lock prevents race conditions
   - If any variant is out of stock, entire order fails (no partial deduction)

3. **Webhook processing is idempotent**
   - `webhookEventId` ensures single processing
   - Multiple deliveries safe

---

## Testing Strategy

### Backend Unit Tests

**File**: `CheckoutServiceImplTest.java`
- ✅ Valid cart → validation passes
- ✅ Empty cart → validation fails
- ✅ Insufficient stock → validation fails with correct issue
- ✅ Inactive variant → validation fails
- ✅ Total calculation accuracy

**File**: `OrderServiceImplTest.java`
- ✅ Order creation with valid cart
- ✅ Order number generation uniqueness
- ✅ Snapshot accuracy (address, product, price)
- ✅ Ownership enforcement (get order by number)
- ✅ Order creation fails with empty cart

**File**: `PaymentServiceImplTest.java`
- ✅ Signature verification success
- ✅ Signature verification failure
- ✅ Webhook signature validation
- ✅ Webhook idempotency

**File**: `InventoryServiceImplTest.java`
- ✅ Stock reservation success
- ✅ Concurrent reservation conflict (pessimistic lock)
- ✅ Stock restoration on cancellation
- ✅ Transaction logging

### Backend Integration Tests

**File**: `CheckoutIntegrationTest.java`
- ✅ Full checkout flow: validate → create order → verify payment
- ✅ Concurrent order creation with same last item
- ✅ Webhook processing flow

### Frontend Manual Testing Checklist

- [ ] Checkout validation shows correct totals
- [ ] Stock error displayed when item unavailable
- [ ] Address selection works
- [ ] Add address form validation
- [ ] Razorpay checkout opens with correct amount
- [ ] Payment success → cart clears, redirects to order page
- [ ] Payment failure → error shown, cart intact
- [ ] Payment cancelled → order exists, cart intact
- [ ] Webhook arrives first → frontend verification succeeds
- [ ] Order history displays correctly
- [ ] Order detail page shows all information

### Build Verification

**Frontend**:
```bash
cd odessi-store
npm run lint    # Must pass with 0 errors
npm run build   # Must compile successfully
```

**Backend**:
```bash
cd backend/odessi-api
mvn clean test  # All tests must pass
mvn compile     # Must compile successfully
```

---

## Implementation Order

### Phase 5A — Backend Foundation (Days 1-2)

1. Run migration `V8__phase5_checkout_enhancements.sql`
2. Update `OrderStatus` enum
3. Update `Payment` entity (add `webhookEventId`)
4. Create `InventoryTransaction` entity and repository
5. Add Razorpay dependency to `pom.xml`
6. Create all DTOs (request/response)
7. Create `RazorpayConfig`
8. Update `.env.example` and `application.yml`

### Phase 5B — Services (Days 3-4)

9. Implement `InventoryService` + tests
10. Implement `CheckoutService` + tests
11. Implement `OrderService` + tests
12. Implement `PaymentService` (Razorpay integration) + tests

### Phase 5C — Controllers (Day 5)

13. Create `CheckoutController`
14. Create `OrderController`
15. Create `PaymentController`
16. Update `SecurityConfig` (webhook CSRF exemption)

### Phase 5D — Frontend API Clients (Day 6)

17. Create `lib/api/addresses.ts`
18. Create `lib/api/checkout.ts`
19. Create `lib/api/orders.ts`
20. Create `lib/api/payments.ts`
21. Add Razorpay TypeScript types

### Phase 5E — Frontend Pages (Days 7-8)

22. Create `app/checkout/page.tsx`
23. Create `app/account/orders/page.tsx`
24. Create `app/orders/[orderNumber]/page.tsx`
25. Add Razorpay script to `app/layout.tsx`
26. Update navigation (add "Orders" link to account dropdown)

### Phase 5F — Testing & Polish (Days 9-10)

27. Write backend integration tests
28. Manual testing checklist
29. Fix bugs
30. Update README with Phase 5 completion notes

---

## Files to Modify

### Backend

| File | Modification |
|------|--------------|
| `pom.xml` | Add Razorpay dependency |
| `.env.example` | Add Razorpay keys |
| `application.yml` | Add Razorpay config section |
| `OrderStatus.java` | Add `PENDING_PAYMENT`, `PAYMENT_PROCESSING` |
| `Payment.java` | Add `webhookEventId` field |
| `SecurityConfig.java` | Add webhook CSRF exemption, checkout endpoint protection |

### Frontend

| File | Modification |
|------|--------------|
| `app/layout.tsx` | Add Razorpay script tag |
| `components/layout/Navbar.tsx` | Add "Orders" link to account dropdown |

---

## New Files to Create

### Backend

**Entities**:
- `InventoryTransaction.java`
- `TransactionType.java`

**DTOs (Request)**:
- `CreateOrderRequest.java`
- `VerifyPaymentRequest.java`

**DTOs (Response)**:
- `CheckoutValidationResponse.java`
- `ValidationIssue.java`
- `CartSummaryResponse.java`
- `CartSummaryItemResponse.java`
- `CreateOrderResponse.java`
- `PaymentResponse.java`
- `RazorpayCheckoutData.java`
- `VerifyPaymentResponse.java`

**Repositories**:
- `InventoryTransactionRepository.java`

**Services (Interfaces)**:
- `CheckoutService.java`
- `OrderService.java`
- `PaymentService.java`
- `InventoryService.java`

**Services (Implementations)**:
- `CheckoutServiceImpl.java`
- `OrderServiceImpl.java`
- `PaymentServiceImpl.java`
- `InventoryServiceImpl.java`

**Controllers**:
- `CheckoutController.java`
- `OrderController.java`
- `PaymentController.java`

**Config**:
- `RazorpayConfig.java`

**Mappers**:
- `OrderMapper.java`
- `PaymentMapper.java`

**Migrations**:
- `V8__phase5_checkout_enhancements.sql`

**Tests** (create corresponding test files for all services)

### Frontend

**API Clients**:
- `lib/api/addresses.ts`
- `lib/api/checkout.ts`
- `lib/api/orders.ts`
- `lib/api/payments.ts`

**Pages**:
- `app/checkout/page.tsx`
- `app/account/orders/page.tsx`
- `app/orders/[orderNumber]/page.tsx`

**Types**:
- `types/razorpay.d.ts`

**Components** (suggested):
- `components/checkout/AddressSelector.tsx`
- `components/checkout/OrderSummary.tsx`
- `components/checkout/AddressForm.tsx`
- `components/orders/OrderCard.tsx`
- `components/orders/OrderDetails.tsx`
- `components/orders/OrderStatusBadge.tsx`

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Razorpay API downtime | Medium | High | Handle gracefully, show user error, retry option |
| Race condition on inventory | Medium | High | Pessimistic locking, transaction isolation |
| Webhook signature bypass | Low | Critical | Always validate, fail closed |
| Order/Payment state desync | Medium | High | Idempotent webhook, state machine validation |
| Frontend payment modal closed | High | Medium | Order preserved, user can retry (future: payment links) |
| Currency mismatch | Low | High | Enforce INR throughout, validate in backend |
| Price changes during checkout | Medium | Low | User sees latest price in validation, order uses that price |

---

## Post-Implementation Enhancements (Phase 6+)

1. **Payment retry** — Allow user to pay for existing `PENDING_PAYMENT` orders
2. **Discount codes** — Apply coupon codes at checkout
3. **Tax calculation** — GST/regional tax based on address
4. **Shipping calculation** — Dynamic shipping based on location/weight
5. **Partial refunds** — Return individual items
6. **Order tracking** — Shipment tracking integration
7. **Email notifications** — Order confirmation, shipment updates
8. **Admin order management** — View all orders, update status, process refunds
9. **Analytics** — Order funnel, abandoned carts, conversion tracking
10. **Internationalization** — Multi-currency support

---

## Sign-Off

**Plan Status**: PENDING REVIEW  
**Estimated Implementation Time**: 10 days  
**Team Review Required**: YES  
**Blocking Issues**: None  

**Approval Required From**:
- [ ] Backend Lead — Entity/Service design
- [ ] Frontend Lead — UX flow, Razorpay integration
- [ ] DevOps — Razorpay credentials setup, webhook endpoint
- [ ] Product Owner — Checkout flow, order lifecycle

**DO NOT IMPLEMENT UNTIL THIS PLAN IS REVIEWED AND APPROVED.**

---

*End of Phase 5 Implementation Plan*
