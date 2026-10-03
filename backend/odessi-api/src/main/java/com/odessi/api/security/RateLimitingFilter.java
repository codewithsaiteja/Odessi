package com.odessi.api.security;

import com.odessi.api.config.AppProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Composite rate-limiting filter — Phase 8 Security Hardening.
 *
 * <h3>Key design</h3>
 * <ul>
 *   <li><b>Unauthenticated endpoints</b> (login, register, forgot-password, reset-password, refresh):
 *       keyed by {@code clientIp + "|" + endpointPath}. Limits brute-force and credential stuffing.</li>
 *   <li><b>Authenticated endpoints</b> (coupon validate, etc.):
 *       keyed by {@code userId + "|" + endpointPath}. Limits per-user abuse of protected APIs.</li>
 * </ul>
 *
 * <h3>Algorithm</h3>
 * Fixed window counter — simple and CPU-light. Each bucket stores a request count and a
 * window-expiry timestamp. When the window expires the bucket resets atomically.
 *
 * <h3>Production note</h3>
 * This implementation stores state in-memory. A single application instance works correctly.
 * For <em>multi-instance production clusters</em>, replace with a distributed counter backed by
 * Redis (e.g., using Lua-script atomic increment or Spring Data Redis).  No external dependency
 * is introduced in Phase 8.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingFilter.class);

    /** Unauthenticated endpoints subject to IP + endpoint rate limiting. */
    private static final Set<String> UNAUTH_LIMITED_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/verify-reset-otp",
            "/api/auth/reset-password",
            "/api/auth/refresh",
            "/api/try-on/token"
    );

    /** Authenticated endpoint paths subject to user + endpoint rate limiting. */
    private static final Set<String> AUTH_LIMITED_PATHS = Set.of(
            "/api/coupons/validate"
    );

    private final AppProperties appProperties;
    private final JwtService jwtService;

    /** In-memory bucket storage: key → RateBucket */
    private final Map<String, RateBucket> buckets = new ConcurrentHashMap<>();

    public RateLimitingFilter(AppProperties appProperties, JwtService jwtService) {
        this.appProperties = appProperties;
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Never rate-limit CORS preflight OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();

        // ── Unauthenticated path rate limiting (IP + endpoint) ──────────────────
        if (UNAUTH_LIMITED_PATHS.contains(path)) {
            String clientIp = resolveClientIp(request);
            String bucketKey = clientIp + "|" + path;
            AppProperties.RateLimit cfg = appProperties.getRateLimit();

            if (isRateLimited(bucketKey, cfg.getUnauthMaxRequests(), cfg.getUnauthWindowSeconds())) {
                log.warn("Rate limit exceeded for unauthenticated path. IP={} path={}", clientIp, path);
                sendTooManyRequests(response, "Rate limit exceeded. Please try again later.");
                return;
            }
        }

        // ── Authenticated path rate limiting (userId + endpoint) ────────────────
        else if (AUTH_LIMITED_PATHS.contains(path)) {
            String userId = resolveAuthenticatedUserId(request);
            if (userId != null) {
                String bucketKey = userId + "|" + path;
                AppProperties.RateLimit cfg = appProperties.getRateLimit();

                if (isRateLimited(bucketKey, cfg.getAuthMaxRequests(), cfg.getAuthWindowSeconds())) {
                    log.warn("Rate limit exceeded for authenticated path. userId={} path={}", userId, path);
                    sendTooManyRequests(response, "Rate limit exceeded. Please try again later.");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    // ── Fixed-window rate limiter ─────────────────────────────────────────────

    /**
     * Returns {@code true} if the given bucket has exceeded {@code maxRequests} within
     * the sliding {@code windowSeconds} window.
     */
    private boolean isRateLimited(String bucketKey, int maxRequests, int windowSeconds) {
        long now = System.currentTimeMillis();
        long windowMs = (long) windowSeconds * 1000;

        RateBucket bucket = buckets.computeIfAbsent(bucketKey, k -> new RateBucket(now + windowMs));

        synchronized (bucket) {
            if (now > bucket.windowExpiresAt) {
                // Window expired — reset counter for new window
                bucket.windowExpiresAt = now + windowMs;
                bucket.count.set(0);
            }
            int count = bucket.count.incrementAndGet();
            return count > maxRequests;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Resolves the real client IP, respecting common proxy headers. */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // X-Forwarded-For: client, proxy1, proxy2 — take the first (leftmost) IP
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Extracts the userId from the access token cookie (if present) for authenticated rate limiting.
     * Returns {@code null} if no valid token is present (unauthenticated request).
     */
    private String resolveAuthenticatedUserId(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if ("access_token".equals(cookie.getName())) {
                try {
                    // Extract userId claim from JWT (avoids DB lookup in the filter)
                    String userIdClaim = jwtService.extractClaim(cookie.getValue(),
                            claims -> claims.get("userId", Long.class) != null
                                    ? String.valueOf(claims.get("userId", Long.class))
                                    : claims.getSubject());
                    return userIdClaim;
                } catch (Exception e) {
                    // Invalid/expired token — treat as unauthenticated
                    return null;
                }
            }
        }
        return null;
    }

    private void sendTooManyRequests(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"TOO_MANY_REQUESTS\",\"message\":\"" + message + "\"}");
    }

    // ── Fixed-window bucket ───────────────────────────────────────────────────

    private static class RateBucket {
        volatile long windowExpiresAt;
        final AtomicInteger count = new AtomicInteger(0);

        RateBucket(long windowExpiresAt) {
            this.windowExpiresAt = windowExpiresAt;
        }
    }
}
