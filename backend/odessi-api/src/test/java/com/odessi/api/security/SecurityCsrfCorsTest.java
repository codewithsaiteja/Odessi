package com.odessi.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odessi.api.config.AppProperties;
import com.odessi.api.config.SecurityConfig;
import com.odessi.api.controller.CartController;
import com.odessi.api.controller.AuthController;
import com.odessi.api.dto.request.LoginRequest;
import com.odessi.api.dto.response.UserResponse;
import com.odessi.api.entity.RefreshToken;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.exception.GlobalExceptionHandler;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.CartService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * CSRF & CORS Security Tests — Phase 8.
 *
 * <p>Verifies:
 * <ul>
 *   <li>State-changing requests WITHOUT a valid CSRF token are rejected with 403.</li>
 *   <li>GET requests do NOT require a CSRF token.</li>
 *   <li>Auth endpoints (login, register, refresh, forgot/reset-password) are CSRF-exempt.</li>
 *   <li>The Razorpay webhook path is configured as CSRF-exempt (server-to-server).</li>
 *   <li>CORS preflight from allowed origin returns correct headers.</li>
 *   <li>CORS preflight from untrusted origin does NOT echo the origin back.</li>
 * </ul>
 *
 * <p>Two {@code @WebMvcTest} slices are used because CSRF tests target different controller slices
 * (CartController for protected endpoints; AuthController for CSRF-exempt auth endpoints).
 */
@WebMvcTest(controllers = {CartController.class, AuthController.class})
@Import({GlobalExceptionHandler.class, SecurityConfig.class, AppProperties.class,
         JwtAuthenticationFilter.class, RateLimitingFilter.class})
@DisplayName("Phase 8 — CSRF & CORS Security Tests")
class SecurityCsrfCorsTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean CartService cartService;
    @MockBean AuthService authService;
    @MockBean JwtService jwtService;
    @MockBean CustomUserDetailsService customUserDetailsService;

    private User testUser;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        testUser = new User("Test", "User", "test@odessi.com", "$2a$12$hash");
        testUser.setId(1L);
        testUser.setRole(Role.CUSTOMER);
        testUser.setEnabled(true);
        testUser.setEmailVerified(true);

        userResponse = new UserResponse(
                1L, "Test", "User", "test@odessi.com",
                null, Role.CUSTOMER, true, true, Instant.now()
        );
    }

    // ── CSRF Tests — Protected Endpoints ──────────────────────────────────────

    @Nested
    @DisplayName("CSRF Protection — Protected Endpoints")
    class CsrfProtectedTests {

        @Test
        @DisplayName("POST /api/cart/items — 403 when no CSRF token provided")
        void postCart_noCSRF_returns403() throws Exception {
            mockMvc.perform(post("/api/cart/items")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"variantId\":1,\"quantity\":1}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("DELETE /api/cart/items/1 — 403 when no CSRF token provided")
        void deleteCartItem_noCSRF_returns403() throws Exception {
            mockMvc.perform(delete("/api/cart/items/1"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("GET /api/cart — 401 without auth (GET does NOT require CSRF)")
        void getCart_noCSRF_returns401NotForbidden() throws Exception {
            // GET must NOT be blocked by CSRF — should reach auth check and return 401
            mockMvc.perform(get("/api/cart"))
                    .andExpect(status().isUnauthorized());
        }
    }

    // ── CSRF Tests — Exempt Endpoints ─────────────────────────────────────────

    @Nested
    @DisplayName("CSRF Exemptions — Auth & Webhook Paths")
    class CsrfExemptTests {

        @Test
        @DisplayName("POST /api/auth/login — CSRF exempt — must not return 403")
        void loginEndpoint_csrfExempt_noForbidden() throws Exception {
            // Mock service to return something so we don't get NPE
            given(authService.authenticate(any())).willReturn(testUser);
            given(jwtService.generateToken(any(CustomUserDetails.class))).willReturn("jwt");
            RefreshToken rt = new RefreshToken();
            rt.setTokenHash("rt");
            rt.setExpiresAt(Instant.now().plusSeconds(604800));
            given(authService.createRefreshToken(any())).willReturn(rt);
            given(authService.mapToUserResponse(any())).willReturn(userResponse);

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(buildLoginRequest("test@odessi.com", "Passw0rd!"))))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        if (status == 403) {
                            throw new AssertionError("Login should be CSRF-exempt, got 403.");
                        }
                    });
        }

        @Test
        @DisplayName("POST /api/auth/register — CSRF exempt — must not return 403")
        void registerEndpoint_csrfExempt_noForbidden() throws Exception {
            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"firstName\":\"T\",\"lastName\":\"U\",\"email\":\"t@odessi.com\",\"password\":\"Passw0rd!\"}"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        if (status == 403) {
                            throw new AssertionError("Register should be CSRF-exempt, got 403.");
                        }
                    });
        }

        @Test
        @DisplayName("POST /api/auth/refresh — CSRF exempt — 401 (no cookie), not 403 (CSRF block)")
        void refreshEndpoint_csrfExempt_noForbidden() throws Exception {
            mockMvc.perform(post("/api/auth/refresh"))
                    .andExpect(status().isUnauthorized()); // 401, NOT 403
        }

        @Test
        @DisplayName("POST /api/webhooks/razorpay — CSRF exempt path — no CSRF 403 block")
        void webhookPath_csrfExempt_noForbidden() throws Exception {
            // The webhook endpoint is in ignoringRequestMatchers → CSRF not enforced.
            // In this slice, if the controller isn't loaded → 404; either way not 403.
            mockMvc.perform(post("/api/webhooks/razorpay")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("X-Razorpay-Signature", "any-sig")
                    .content("{\"event\":\"test\",\"event_id\":\"e1\"}"))
                    .andExpect(result -> {
                        int status = result.getResponse().getStatus();
                        if (status == 403) {
                            throw new AssertionError("Webhook path must be CSRF-exempt, got 403.");
                        }
                    });
        }
    }

    // ── CORS Tests ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("CORS Origin Enforcement")
    class CorsTests {

        @Test
        @DisplayName("OPTIONS preflight for /api/cart from localhost:3000 — includes Access-Control-Allow-Origin")
        void preflight_allowedOrigin_includesCorsHeaders() throws Exception {
            mockMvc.perform(options("/api/cart")
                    .header("Origin", "http://localhost:3000")
                    .header("Access-Control-Request-Method", "GET")
                    .header("Access-Control-Request-Headers", "Content-Type"))
                    .andExpect(status().isOk())
                    .andExpect(header().exists("Access-Control-Allow-Origin"))
                    .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
        }

        @Test
        @DisplayName("OPTIONS preflight for /api/auth/me from https://odessitfi.me — returns 200 with CORS headers")
        void preflight_authMe_apexDomain_succeedsWithCorsHeaders() throws Exception {
            mockMvc.perform(options("/api/auth/me")
                    .header("Origin", "https://odessitfi.me")
                    .header("Access-Control-Request-Method", "GET")
                    .header("Access-Control-Request-Headers", "Authorization, Content-Type, X-XSRF-TOKEN, sentry-trace, baggage"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", "https://odessitfi.me"))
                    .andExpect(header().string("Access-Control-Allow-Credentials", "true"))
                    .andExpect(header().exists("Access-Control-Allow-Methods"));
        }

        @Test
        @DisplayName("OPTIONS preflight for /api/auth/me from https://www.odessitfi.me — returns 200 with CORS headers")
        void preflight_authMe_wwwDomain_succeedsWithCorsHeaders() throws Exception {
            mockMvc.perform(options("/api/auth/me")
                    .header("Origin", "https://www.odessitfi.me")
                    .header("Access-Control-Request-Method", "GET")
                    .header("Access-Control-Request-Headers", "Authorization, Content-Type, X-XSRF-TOKEN, sentry-trace, baggage"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", "https://www.odessitfi.me"))
                    .andExpect(header().string("Access-Control-Allow-Credentials", "true"))
                    .andExpect(header().exists("Access-Control-Allow-Methods"));
        }

        @Test
        @DisplayName("OPTIONS preflight for /api/products from https://www.odessitfi.me — returns 200")
        void preflight_products_wwwDomain_succeedsWithCorsHeaders() throws Exception {
            mockMvc.perform(options("/api/products")
                    .header("Origin", "https://www.odessitfi.me")
                    .header("Access-Control-Request-Method", "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", "https://www.odessitfi.me"))
                    .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }

        @Test
        @DisplayName("OPTIONS preflight for /api/csrf from https://odessitfi.me — returns 200")
        void preflight_csrf_apexDomain_succeedsWithCorsHeaders() throws Exception {
            mockMvc.perform(options("/api/csrf")
                    .header("Origin", "https://odessitfi.me")
                    .header("Access-Control-Request-Method", "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", "https://odessitfi.me"))
                    .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }

        @Test
        @DisplayName("OPTIONS preflight for /api/homepage/content from https://www.odessitfi.me — returns 200")
        void preflight_homepage_wwwDomain_succeedsWithCorsHeaders() throws Exception {
            mockMvc.perform(options("/api/homepage/content")
                    .header("Origin", "https://www.odessitfi.me")
                    .header("Access-Control-Request-Method", "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", "https://www.odessitfi.me"))
                    .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }

        @Test
        @DisplayName("OPTIONS preflight for /api/health from https://odessitfi.me — returns 200")
        void preflight_health_apexDomain_succeedsWithCorsHeaders() throws Exception {
            mockMvc.perform(options("/api/health")
                    .header("Origin", "https://odessitfi.me")
                    .header("Access-Control-Request-Method", "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", "https://odessitfi.me"))
                    .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }

        @Test
        @DisplayName("OPTIONS preflight from untrusted origin — does NOT echo origin in response")
        void preflight_untrustedOrigin_noCorsHeader() throws Exception {
            mockMvc.perform(options("/api/cart")
                    .header("Origin", "https://evil-attacker.com")
                    .header("Access-Control-Request-Method", "GET"))
                    .andExpect(result -> {
                        String acao = result.getResponse().getHeader("Access-Control-Allow-Origin");
                        if (acao != null && acao.contains("evil-attacker.com")) {
                            throw new AssertionError(
                                "SECURITY: Untrusted origin was echoed back in ACAO header: " + acao);
                        }
                    });
        }

        @Test
        @DisplayName("CORS: credentials=true for allowed origin (never wildcard)")
        void cors_allowedOrigin_credentialsTrue() throws Exception {
            mockMvc.perform(options("/api/cart")
                    .header("Origin", "http://localhost:3000")
                    .header("Access-Control-Request-Method", "GET"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }

        @Test
        @DisplayName("GET /api/auth/me without authentication returns 401 — CORS preflight allowance does not bypass security")
        void getAuthMe_withoutAuth_stillReturns401() throws Exception {
            mockMvc.perform(get("/api/auth/me")
                    .header("Origin", "https://odessitfi.me"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(header().string("Access-Control-Allow-Origin", "https://odessitfi.me"))
                    .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private LoginRequest buildLoginRequest(String email, String password) {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }
}
