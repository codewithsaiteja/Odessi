# SECURITY.md — Odessi.tfi Production Security Guide

This document describes the security architecture, threat mitigations, and operational guidelines for the Odessi.tfi e-commerce platform.

---

## Table of Contents

1. [Authentication & Token Lifecycle](#1-authentication--token-lifecycle)
2. [Refresh Token Rotation & Reuse Detection](#2-refresh-token-rotation--reuse-detection)
3. [Cookie Security](#3-cookie-security)
4. [Rate Limiting](#4-rate-limiting)
5. [CSRF Protection](#5-csrf-protection)
6. [CORS Policy](#6-cors-policy)
7. [IDOR / BOLA Prevention](#7-idor--bola-prevention)
8. [Razorpay Payment Security](#8-razorpay-payment-security)
9. [Security Headers](#9-security-headers)
10. [Open Redirect Protection](#10-open-redirect-protection)
11. [Secret Management](#11-secret-management)
12. [Production Checklist](#12-production-checklist)

---

## 1. Authentication & Token Lifecycle

Odessi.tfi uses a dual-token authentication system:

| Token | Storage | Lifetime | Purpose |
|-------|---------|----------|---------|
| **Access Token** (JWT) | HttpOnly cookie | 15 minutes | Authorises API requests |
| **Refresh Token** | HttpOnly cookie + DB (`refresh_tokens` table) | 7 days | Issues new access tokens |

### Access Token Validation

- JWT HMAC-SHA256 signed with `JWT_SECRET` (read from environment, never hardcoded).
- Validated on every request by `JwtAuthenticationFilter`.
- Contains: `sub` (email), `userId`, `roles`, `iat`, `exp`.

### Refresh Token Storage

- A cryptographically random UUID string is stored in the database, hashed by the application.
- The `refresh_tokens` table stores: `token_hash`, `user_id`, `expires_at`, `revoked`, `created_at`, `last_used_at`.

---

## 2. Refresh Token Rotation & Reuse Detection

Every call to `POST /api/auth/refresh` performs **full token rotation**:

```
Client sends old refresh token
  → Server validates: NOT revoked AND NOT expired
  → Server revokes old token (revoked = true)
  → Server issues new access token + new refresh token
  → Both tokens sent to client as HttpOnly cookies
```

### Reuse / Replay Attack Detection

If a **revoked** refresh token is presented again:

```
Revoked refresh token presented
  → Compromise detected (token was stolen and reused)
  → ALL refresh tokens for this user are revoked (entire session family invalidated)
  → 422 Unprocessable Entity returned (no new tokens issued)
  → User must log in again
```

This prevents an attacker who stole a previous refresh token from maintaining access after the legitimate user has already rotated it.

### Password Change / Reset Session Invalidation

- **Password change** (`POST /api/users/me/password`): all existing refresh tokens for the user are revoked.
- **Password reset** (`POST /api/auth/reset-password`): all existing refresh tokens for the user are revoked.

---

## 3. Cookie Security

| Attribute | Value | Notes |
|-----------|-------|-------|
| `HttpOnly` | `true` | Prevents JavaScript access (XSS mitigation) |
| `SameSite` | `Lax` | Prevents CSRF on most cross-site contexts |
| `Secure` | `false` (dev) / `true` (prod) | Set via `AUTH_COOKIE_SECURE` env variable |
| `Path` | `/` | Cookies sent on all paths |

### Configuration

```yaml
app:
  auth:
    cookie-secure: ${AUTH_COOKIE_SECURE:false}   # false for local, true for HTTPS production
    cookie-same-site: ${AUTH_COOKIE_SAME_SITE:Lax}
```

> **Production**: Set `AUTH_COOKIE_SECURE=true` when the application is served over HTTPS.

---

## 4. Rate Limiting

A composite in-memory rate limiter (`RateLimitingFilter`) runs before JWT authentication.

### Tiers

| Tier | Key | Endpoints | Default Limit |
|------|-----|-----------|---------------|
| Unauthenticated | IP + endpoint path | `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/refresh` | 10 req / 60 s |
| Authenticated | userId + endpoint path | `/api/coupons/validate` | 30 req / 60 s |

Exceeded limits return `429 Too Many Requests`:
```json
{"error": "TOO_MANY_REQUESTS", "message": "Rate limit exceeded. Please try again later."}
```

### Configuration

```yaml
app:
  rate-limit:
    unauth-max-requests: ${RATE_LIMIT_UNAUTH_MAX:10}
    unauth-window-seconds: ${RATE_LIMIT_UNAUTH_WINDOW:60}
    auth-max-requests: ${RATE_LIMIT_AUTH_MAX:30}
    auth-window-seconds: ${RATE_LIMIT_AUTH_WINDOW:60}
```

> **Production — Multi-Instance Clusters**: The current implementation stores rate limit state in-memory. For deployments with multiple backend instances (horizontal scaling), replace with a **distributed counter backed by Redis** (e.g., using Lua-script atomic increment or Spring Data Redis). This is documented and no external dependency is introduced in Phase 8.

---

## 5. CSRF Protection

Spring Security `CookieCsrfTokenRepository` is used with `withHttpOnlyFalse()`, which sets an `XSRF-TOKEN` cookie readable by JavaScript for inclusion in the `X-XSRF-TOKEN` request header.

### Protected Endpoints

All state-changing HTTP methods (POST, PUT, PATCH, DELETE) on protected paths require a valid `X-XSRF-TOKEN` header.

### Exempt Endpoints

| Endpoint | Reason |
|----------|--------|
| `POST /api/auth/login` | Public; no session to protect |
| `POST /api/auth/register` | Public; no session to protect |
| `POST /api/auth/refresh` | Token-based; no browser origin context |
| `POST /api/auth/forgot-password` | Public; no session to protect |
| `POST /api/auth/reset-password` | Public; no session to protect |
| `POST /api/webhooks/razorpay` | Server-to-server; protected by HMAC-SHA256 signature |

---

## 6. CORS Policy

Only explicitly allowed origins receive CORS response headers. Wildcard (`*`) is **never** used when `Access-Control-Allow-Credentials: true` is set (this combination is rejected by the browser).

### Configuration

```yaml
app:
  cors:
    allowed-origins: ${FRONTEND_URL:http://localhost:3000}
```

For multiple origins in production:
```
FRONTEND_URL=https://odessi.tfi,https://www.odessi.tfi
```

A safety guard in `SecurityConfig` throws a startup exception if `*` is set as an allowed origin with credentials enabled.

---

## 7. IDOR / BOLA Prevention

**All resource ownership is derived strictly from the authenticated JWT principal** via `SecurityContextHolder`. User IDs supplied in request bodies, query parameters, or path parameters are **never trusted** for ownership decisions.

### Enforcement Points

| Resource | Ownership Enforcement |
|----------|----------------------|
| Addresses | `userId` from JWT principal |
| Cart | `userId` from JWT principal |
| Wishlist | `userId` from JWT principal |
| Orders | `userId` from JWT principal; order.user.id checked against JWT userId |
| Payment verification | `order.getUser().getId()` compared against JWT userId |
| Reviews | Order ownership verified before review creation |
| Admin endpoints | `hasRole('ADMIN')` enforced at URL security config level |

---

## 8. Razorpay Payment Security

### Secret Separation

| Secret | Env Variable | Used For |
|--------|-------------|----------|
| `RAZORPAY_KEY_SECRET` | Payment signature verification (`POST /api/orders/{id}/verify-payment`) |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook HMAC-SHA256 signature verification (`POST /api/webhooks/razorpay`) |

These secrets are **never interchanged**. Using the wrong secret would cause all webhook or payment verifications to fail.

### Payment Signature Verification

On `POST /api/orders/{id}/verify-payment`, the server independently computes:
```
HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, RAZORPAY_KEY_SECRET)
```
and compares it against the client-provided `razorpay_signature`. Invalid signatures return `400 Bad Request`.

### Amount Tampering Protection

The `VerifyPaymentRequest` contains **no amount field**. The order total is always read from the server-side `Order` entity, making client-side amount manipulation impossible.

### Webhook Security

1. **HMAC-SHA256 signature** verified on every webhook delivery using `RAZORPAY_WEBHOOK_SECRET` and the raw request body bytes.
2. **Idempotency**: `PaymentWebhookEvent` table has a `UNIQUE` constraint on `event_id`. Duplicate webhook deliveries are silently ignored via `DataIntegrityViolationException` catch.
3. **State regression protection**: Events are ignored if the order is already in a terminal state (CONFIRMED, CANCELLED, PAYMENT_FAILED).

---

## 9. Security Headers

### Backend (Spring Security — all `/api/**` responses)

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | See below |
| `Strict-Transport-Security` | Enabled only in `prod`/`staging` profiles (HTTPS only) |

**Note**: `X-XSS-Protection` is **not set** — it is obsolete in modern browsers and can cause security issues (blocking legitimate content on older browsers).

### Content-Security-Policy

Based on actual confirmed application resources:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https://images.unsplash.com https://plus.unsplash.com;
connect-src 'self' https://api.razorpay.com;
frame-src https://api.razorpay.com https://checkout.razorpay.com;
object-src 'none';
base-uri 'self';
form-action 'self';
```

> `'unsafe-inline'` and `'unsafe-eval'` are required by Next.js. When a nonce-based CSP is implemented, these can be removed.

### Frontend (Next.js — all page responses)

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

**HSTS**: Set at the CDN/reverse proxy level (Nginx, Vercel, Cloudflare) for production HTTPS deployments. Not set in application code to avoid breaking local HTTP development.

---

## 10. Open Redirect Protection

All frontend redirect targets are validated before use using `lib/utils/redirect.ts`:

```typescript
import { safeRedirect } from "@/lib/utils/redirect";

// Usage:
const redirectTo = safeRedirect(searchParams.get("redirect"), "/");
router.push(redirectTo);
```

**Blocked patterns:**
- Absolute URLs: `http://evil.com`, `https://evil.com`
- Protocol-relative: `//evil.com`
- JavaScript schemes: `javascript:alert(1)`
- Backslash bypass: `\/evil.com`
- CRLF injection: `%0D%0A` in redirect paths
- User-at-host bypass: `/@evil.com`

---

## 11. Secret Management

| Secret | Environment Variable | Purpose |
|--------|---------------------|---------|
| JWT signing key | `JWT_SECRET` | HMAC-SHA256 key for access tokens (Base64-encoded, ≥32 bytes) |
| DB password | `DB_PASSWORD` | PostgreSQL connection |
| Razorpay payment key | `RAZORPAY_KEY_SECRET` | Payment signature verification |
| Razorpay webhook key | `RAZORPAY_WEBHOOK_SECRET` | Webhook HMAC verification |

**Rules:**
- No real credentials in source code, `.env` files committed to git, or application logs.
- `.env.example` contains variable names and placeholder defaults only.
- Rotate secrets immediately if exposure is suspected.
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) in production.

---

## 12. Production Checklist

Before going live, verify all of the following:

- [ ] `AUTH_COOKIE_SECURE=true` (HTTPS only)
- [ ] `JWT_SECRET` is a cryptographically random string, ≥32 bytes, Base64-encoded
- [ ] `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are set to real Razorpay production values
- [ ] `FRONTEND_URL` is set to the production domain (no `localhost`)
- [ ] Database password is strong and not the default
- [ ] `SEED_DATA_ENABLED=false` (disable demo data seeder)
- [ ] HSTS configured at the reverse proxy / CDN level
- [ ] Rate limiting reviewed and limits adjusted for expected production traffic
- [ ] Razorpay webhook signature secret registered in Razorpay Dashboard
- [ ] All environment variables stored in a secrets manager, not in `.env` files
- [ ] `server.error.include-stacktrace=never` (already configured)
- [ ] Database user has minimal required permissions (no superuser)
- [ ] TLS 1.2+ enforced at the reverse proxy level
- [ ] Admin accounts use strong, unique passwords
