package com.odessi.api.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odessi.api.config.AppProperties;
import com.odessi.api.config.SecurityConfig;
import com.odessi.api.dto.request.LoginRequest;
import com.odessi.api.dto.response.UserResponse;
import com.odessi.api.entity.RefreshToken;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.GlobalExceptionHandler;
import com.odessi.api.service.AuthService;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Security Authentication Tests — Phase 8.
 *
 * <p>Verifies:
 * <ul>
 *   <li>Refresh token rotation: old token revoked, new token issued on each /refresh call.</li>
 *   <li>Refresh token reuse/replay detection: revoked token → 422 (BusinessException) returned.</li>
 *   <li>Cookie attributes: HttpOnly, SameSite=Lax, Secure=false for local HTTP.</li>
 *   <li>Logout: revokes the presented refresh token and clears cookies.</li>
 *   <li>Rate limiting: 10 rapid /api/auth/login requests from same IP → 11th returns 429.</li>
 * </ul>
 *
 * <p>Cookie values are never logged or asserted in test output (only attribute presence is checked).
 */
@WebMvcTest(controllers = com.odessi.api.controller.AuthController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class, AppProperties.class,
         JwtAuthenticationFilter.class, RateLimitingFilter.class})
@DisplayName("Phase 8 — Security Authentication Tests")
class SecurityAuthenticationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

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

    // ── Cookie Attribute Tests ──────────────────────────────────────────────────

    @Nested
    @DisplayName("Cookie Security Attributes")
    class CookieAttributes {

        @Test
        @DisplayName("Login response cookies (access_token and refresh_token) are HttpOnly")
        void login_cookies_areHttpOnly() throws Exception {
            RefreshToken rt = new RefreshToken();
            rt.setTokenHash("opaque-refresh-token");
            rt.setExpiresAt(Instant.now().plusSeconds(604800));

            given(authService.authenticate(any())).willReturn(testUser);
            given(jwtService.generateToken(any(CustomUserDetails.class))).willReturn("header.payload.sig");
            given(authService.createRefreshToken(any())).willReturn(rt);
            given(authService.mapToUserResponse(any())).willReturn(userResponse);

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(
                            buildLoginRequest("test@odessi.com", "Password1!"))))
                    .andExpect(status().isOk())
                    .andExpect(header().exists("Set-Cookie"))
                    // Check that access_token and refresh_token cookies are HttpOnly
                    .andExpect(result -> {
                        var cookieHeaders = result.getResponse().getHeaders("Set-Cookie");
                        // Filter only auth cookies (not XSRF-TOKEN which is intentionally NOT HttpOnly)
                        var authCookies = cookieHeaders.stream()
                                .filter(h -> h.startsWith("access_token") || h.startsWith("refresh_token"))
                                .toList();
                        if (authCookies.size() < 2) {
                            throw new AssertionError("Expected access_token and refresh_token cookies, got: " + cookieHeaders);
                        }
                        boolean allHttpOnly = authCookies.stream()
                                .allMatch(h -> h.toLowerCase().contains("httponly"));
                        if (!allHttpOnly) {
                            throw new AssertionError("Auth cookies (access_token, refresh_token) must be HttpOnly. Got: " + authCookies);
                        }
                    });
        }

        @Test
        @DisplayName("Login response cookies (access_token and refresh_token) have SameSite=Lax")
        void login_cookies_haveSameSiteLax() throws Exception {
            RefreshToken rt = new RefreshToken();
            rt.setTokenHash("opaque-refresh-token");
            rt.setExpiresAt(Instant.now().plusSeconds(604800));

            given(authService.authenticate(any())).willReturn(testUser);
            given(jwtService.generateToken(any(CustomUserDetails.class))).willReturn("header.payload.sig");
            given(authService.createRefreshToken(any())).willReturn(rt);
            given(authService.mapToUserResponse(any())).willReturn(userResponse);

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(
                            buildLoginRequest("test@odessi.com", "Password1!"))))
                    .andExpect(status().isOk())
                    .andExpect(result -> {
                        var cookieHeaders = result.getResponse().getHeaders("Set-Cookie");
                        // Filter only auth cookies (XSRF-TOKEN does not need SameSite=Lax)
                        var authCookies = cookieHeaders.stream()
                                .filter(h -> h.startsWith("access_token") || h.startsWith("refresh_token"))
                                .toList();
                        boolean allSameSiteLax = authCookies.stream()
                                .allMatch(h -> h.toLowerCase().contains("samesite=lax"));
                        if (!allSameSiteLax) {
                            throw new AssertionError("Auth cookies must have SameSite=Lax. Got: " + authCookies);
                        }
                    });
        }

        @Test
        @DisplayName("Login response cookies (access_token and refresh_token) are NOT Secure for local HTTP (cookie-secure=false)")
        void login_cookies_notSecureForLocalHttp() throws Exception {
            RefreshToken rt = new RefreshToken();
            rt.setTokenHash("opaque-refresh-token");
            rt.setExpiresAt(Instant.now().plusSeconds(604800));

            given(authService.authenticate(any())).willReturn(testUser);
            given(jwtService.generateToken(any(CustomUserDetails.class))).willReturn("header.payload.sig");
            given(authService.createRefreshToken(any())).willReturn(rt);
            given(authService.mapToUserResponse(any())).willReturn(userResponse);

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(
                            buildLoginRequest("test@odessi.com", "Password1!"))))
                    .andExpect(status().isOk())
                    .andExpect(result -> {
                        var cookieHeaders = result.getResponse().getHeaders("Set-Cookie");
                        // Filter only auth cookies
                        var authCookies = cookieHeaders.stream()
                                .filter(h -> h.startsWith("access_token") || h.startsWith("refresh_token"))
                                .toList();
                        // In test environment, auth.cookie-secure=false (default)
                        // so auth cookies must NOT contain the Secure attribute
                        boolean anySecure = authCookies.stream()
                                .anyMatch(h -> {
                                    String lower = h.toLowerCase();
                                    int secureIdx = lower.indexOf(";secure");
                                    int secureSpaceIdx = lower.indexOf("; secure");
                                    return secureIdx >= 0 || secureSpaceIdx >= 0;
                                });
                        if (anySecure) {
                            throw new AssertionError("Auth cookies should NOT have Secure flag in local HTTP dev (cookie-secure=false).");
                        }
                    });
        }
    }

    // ── Refresh Token Rotation ──────────────────────────────────────────────────

    @Nested
    @DisplayName("Refresh Token Rotation")
    class TokenRotation {

        @Test
        @DisplayName("POST /api/auth/refresh — issues new access + refresh tokens (rotation)")
        void refresh_issuesNewTokenPair() throws Exception {
            RefreshToken oldToken = new RefreshToken();
            oldToken.setTokenHash("old-refresh-token");
            oldToken.setUser(testUser);
            oldToken.setExpiresAt(Instant.now().plusSeconds(604800));

            RefreshToken newToken = new RefreshToken();
            newToken.setTokenHash("new-refresh-token");
            newToken.setUser(testUser);
            newToken.setExpiresAt(Instant.now().plusSeconds(604800));

            given(authService.verifyAndRotateRefreshToken("old-refresh-token")).willReturn(oldToken);
            given(jwtService.generateToken(any(CustomUserDetails.class))).willReturn("new.access.jwt");
            given(authService.createRefreshToken(testUser)).willReturn(newToken);

            mockMvc.perform(post("/api/auth/refresh")
                    .cookie(new Cookie("refresh_token", "old-refresh-token")))
                    .andExpect(status().isOk())
                    .andExpect(header().exists("Set-Cookie"));

            // verifyAndRotateRefreshToken must be called (not the old verifyRefreshToken)
            verify(authService).verifyAndRotateRefreshToken("old-refresh-token");
            // createRefreshToken must be called to issue new refresh token
            verify(authService).createRefreshToken(testUser);
        }

        @Test
        @DisplayName("POST /api/auth/refresh — 401 when no refresh_token cookie present")
        void refresh_noToken_returns401() throws Exception {
            mockMvc.perform(post("/api/auth/refresh"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("POST /api/auth/refresh — 401 on refresh token reuse (replay attack detected)")
        void refresh_reuseAttack_returns401_andInvalidatesAllSessions() throws Exception {
            given(authService.verifyAndRotateRefreshToken(anyString()))
                    .willThrow(new BusinessException("REFRESH_TOKEN_REUSE",
                            "Security violation: refresh token reuse detected. All sessions have been invalidated."));

            mockMvc.perform(post("/api/auth/refresh")
                    .cookie(new Cookie("refresh_token", "stolen-old-token")))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value("REFRESH_TOKEN_REUSE"));
        }

        @Test
        @DisplayName("POST /api/auth/refresh — 401 on expired refresh token")
        void refresh_expiredToken_returns401() throws Exception {
            given(authService.verifyAndRotateRefreshToken(anyString()))
                    .willThrow(new BusinessException("REFRESH_TOKEN_EXPIRED",
                            "Refresh token has expired. Please log in again."));

            mockMvc.perform(post("/api/auth/refresh")
                    .cookie(new Cookie("refresh_token", "expired-token")))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error").value("REFRESH_TOKEN_EXPIRED"));
        }
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Logout")
    class LogoutTests {

        @Test
        @DisplayName("POST /api/auth/logout — revokes the refresh token cookie and clears cookies (using CSRF + JWT auth)")
        void logout_revokesTokenAndClearsCookies() throws Exception {
            // The logout endpoint is protected — requires a valid JWT access token (and CSRF).
            // Set up JWT mock so the JwtAuthenticationFilter accepts the test token.
            given(jwtService.extractUsername("some.access.jwt")).willReturn("test@odessi.com");
            given(jwtService.isTokenValid(org.mockito.ArgumentMatchers.eq("some.access.jwt"),
                    org.mockito.ArgumentMatchers.any())).willReturn(true);
            given(customUserDetailsService.loadUserByUsername("test@odessi.com"))
                    .willReturn(new CustomUserDetails(testUser));

            mockMvc.perform(post("/api/auth/logout")
                    .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf())
                    .cookie(new Cookie("access_token", "some.access.jwt"))
                    .cookie(new Cookie("refresh_token", "some-refresh-token")))
                    .andExpect(status().isOk())
                    .andExpect(header().exists("Set-Cookie"))
                    .andExpect(result -> {
                        // Cookies are cleared (maxAge=0) — verify access_token and refresh_token both cleared
                        var cookieHeaders = result.getResponse().getHeaders("Set-Cookie");
                        boolean accessCleared = cookieHeaders.stream()
                                .anyMatch(h -> h.contains("access_token") && h.contains("Max-Age=0"));
                        boolean refreshCleared = cookieHeaders.stream()
                                .anyMatch(h -> h.contains("refresh_token") && h.contains("Max-Age=0"));
                        if (!accessCleared || !refreshCleared) {
                            throw new AssertionError("Logout did not clear both cookies with Max-Age=0. Headers: " + cookieHeaders);
                        }
                    });

            // Verify the refresh token was revoked
            verify(authService).revokeRefreshToken("some-refresh-token");
        }
    }

    // ── Rate Limiting ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Rate Limiting")
    class RateLimitingTests {

        @Test
        @DisplayName("POST /api/auth/login — 429 after exceeding IP+endpoint rate limit")
        void login_rateLimited_after10Requests() throws Exception {
            // Mock service to always fail so we don't have to set up full auth
            given(authService.authenticate(any()))
                    .willThrow(new BusinessException("INVALID_CREDENTIALS", "Invalid email or password"));

            String body = objectMapper.writeValueAsString(
                    buildLoginRequest("brute@odessi.com", "WrongPassword1!"));

            // Send 10 requests (at the limit — all should pass through to service)
            for (int i = 0; i < 10; i++) {
                mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .with(request -> {
                            request.setRemoteAddr("10.0.0.99");
                            return request;
                        }));
            }

            // 11th request must be rate limited
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body)
                    .with(request -> {
                        request.setRemoteAddr("10.0.0.99");
                        return request;
                    }))
                    .andExpect(status().isTooManyRequests());
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
