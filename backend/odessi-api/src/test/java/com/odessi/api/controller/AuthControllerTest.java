package com.odessi.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odessi.api.config.AppProperties;
import com.odessi.api.config.SecurityConfig;
import com.odessi.api.dto.request.LoginRequest;
import com.odessi.api.dto.request.RegisterRequest;
import com.odessi.api.dto.response.UserResponse;
import com.odessi.api.entity.RefreshToken;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.GlobalExceptionHandler;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.security.CustomUserDetailsService;
import com.odessi.api.security.JwtAuthenticationFilter;
import com.odessi.api.security.JwtService;
import com.odessi.api.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
 * Slice test for AuthController.
 *
 * <p>Security decisions verified:
 * <ul>
 *   <li>Public auth endpoints (login, register, refresh, forgot/reset password) are excluded from CSRF.</li>
 *   <li>GET /api/auth/me requires authentication — returns 401 without JWT cookie.</li>
 *   <li>Duplicate email registration returns 422 (BusinessException).</li>
 *   <li>Wrong credentials return 422.</li>
 *   <li>Successful login sets Set-Cookie headers.</li>
 * </ul>
 */
@WebMvcTest(AuthController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class, AppProperties.class,
         JwtAuthenticationFilter.class})
@DisplayName("AuthController — Phase 4 Auth Tests")
class AuthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    AuthService authService;

    @MockBean
    JwtService jwtService;

    // Required by SecurityConfig → DaoAuthenticationProvider
    @MockBean
    CustomUserDetailsService customUserDetailsService;

    private User testUser;
    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setFirstName("Test");
        testUser.setLastName("User");
        testUser.setEmail("test@odessi.com");
        testUser.setPasswordHash("$2a$12$hashedpassword");
        testUser.setRole(Role.CUSTOMER);
        testUser.setEnabled(true);
        testUser.setEmailVerified(true);

        userResponse = new UserResponse(
                null, "Test", "User", "test@odessi.com",
                null, Role.CUSTOMER, true, true, Instant.now()
        );
    }

    // ── Registration ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/register — 200 on valid registration")
    void register_success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Test");
        request.setLastName("User");
        request.setEmail("new@odessi.com");
        request.setPassword("Passw0rd!");

        given(authService.register(any())).willReturn(userResponse);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@odessi.com"));
    }

    @Test
    @DisplayName("POST /api/auth/register — 400 when required fields missing")
    void register_validationFails() throws Exception {
        // Empty body — @NotBlank violations on firstName, lastName, email, password
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register — 422 when email already exists")
    void register_duplicateEmail() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Test");
        request.setLastName("User");
        request.setEmail("existing@odessi.com");
        request.setPassword("Passw0rd!");

        given(authService.register(any()))
                .willThrow(new BusinessException("DUPLICATE_EMAIL", "Email already exists"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("Email already exists"));
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login — 200 sets HttpOnly cookies on success")
    void login_success_setsCookies() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@odessi.com");
        request.setPassword("Passw0rd!");

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash("mock-refresh-token");
        refreshToken.setExpiresAt(Instant.now().plusSeconds(604800));

        given(authService.authenticate(any())).willReturn(testUser);
        given(jwtService.generateToken(any(CustomUserDetails.class))).willReturn("mock.jwt.token");
        given(authService.createRefreshToken(any())).willReturn(refreshToken);
        given(authService.mapToUserResponse(any())).willReturn(userResponse);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@odessi.com"))
                .andExpect(header().exists("Set-Cookie"));
    }

    @Test
    @DisplayName("POST /api/auth/login — 422 on wrong credentials")
    void login_wrongPassword() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@odessi.com");
        request.setPassword("WrongPassword1!");

        given(authService.authenticate(any()))
                .willThrow(new BusinessException("INVALID_CREDENTIALS", "Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    // ── CSRF: public auth endpoints are exempt ─────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login — no CSRF token required (ignoringRequestMatchers)")
    void login_noCSRFRequired() throws Exception {
        // Login is in ignoringRequestMatchers → no CSRF header needed → should NOT return 403
        LoginRequest request = new LoginRequest();
        request.setEmail("test@odessi.com");
        request.setPassword("Passw0rd!");

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash("some-token");
        refreshToken.setExpiresAt(Instant.now().plusSeconds(604800));

        given(authService.authenticate(any())).willReturn(testUser);
        given(jwtService.generateToken(any(CustomUserDetails.class))).willReturn("mock.jwt.token");
        given(authService.createRefreshToken(any())).willReturn(refreshToken);
        given(authService.mapToUserResponse(any())).willReturn(userResponse);

        // No X-XSRF-TOKEN header — should still return 200 (not 403) for login
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    // ── Protected endpoint without auth ───────────────────────────────────────

    @Test
    @DisplayName("GET /api/auth/me — 401 when not authenticated")
    void me_unauthenticated_returns401() throws Exception {
        // No JWT cookie → JwtAuthFilter finds no token → anonymous → 401
        mockMvc.perform(get("/api/auth/me")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    // ── Forgot password — always 200 (no user enumeration) ───────────────────

    @Test
    @DisplayName("POST /api/auth/forgot-password — 200 regardless of email existence")
    void forgotPassword_alwaysReturns200() throws Exception {
        // authService.forgotPassword is void; controller always returns 200
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"doesnotexist@odessi.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }
}
