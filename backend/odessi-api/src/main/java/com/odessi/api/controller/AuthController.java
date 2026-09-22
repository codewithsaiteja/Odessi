package com.odessi.api.controller;

import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.ForgotPasswordRequest;
import com.odessi.api.dto.request.LoginRequest;
import com.odessi.api.dto.request.RegisterRequest;
import com.odessi.api.dto.request.ResetPasswordRequest;
import com.odessi.api.dto.response.UserResponse;
import com.odessi.api.entity.RefreshToken;
import com.odessi.api.entity.User;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.security.JwtService;
import com.odessi.api.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final AppProperties appProperties;

    public AuthController(AuthService authService, JwtService jwtService, AppProperties appProperties) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.appProperties = appProperties;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        UserResponse userResponse = authService.register(request);
        // We do not auto-login on register, they must login.
        return ResponseEntity.ok(userResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        User user = authService.authenticate(request);
        CustomUserDetails userDetails = new CustomUserDetails(user);
        
        String jwtToken = jwtService.generateToken(userDetails);
        RefreshToken refreshToken = authService.createRefreshToken(user);
        
        setCookies(response, jwtToken, refreshToken.getTokenHash());
        
        return ResponseEntity.ok(authService.mapToUserResponse(user));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenStr = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refresh_token".equals(cookie.getName())) {
                    refreshTokenStr = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshTokenStr == null) {
            return ResponseEntity.status(401).build();
        }

        // Verifies token validity & revokes the old token (rotation).
        // Throws BusinessException if token is already revoked (reuse/replay attack detected
        // → all sessions invalidated) or if token is expired.
        RefreshToken oldToken = authService.verifyAndRotateRefreshToken(refreshTokenStr);
        CustomUserDetails userDetails = new CustomUserDetails(oldToken.getUser());

        // Issue new access token
        String newJwt = jwtService.generateToken(userDetails);

        // Issue new refresh token (rotation: old token is now revoked)
        RefreshToken newRefreshToken = authService.createRefreshToken(oldToken.getUser());

        setCookies(response, newJwt, newRefreshToken.getTokenHash());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshTokenStr = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refresh_token".equals(cookie.getName())) {
                    refreshTokenStr = cookie.getValue();
                    break;
                }
            }
        }
        
        if (refreshTokenStr != null) {
            authService.revokeRefreshToken(refreshTokenStr);
        }
        
        clearCookies(response);
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(authService.mapToUserResponse(user));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("message", "If the account exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification() {
        User user = authService.getCurrentUser();
        authService.resendVerificationEmail(user);
        return ResponseEntity.ok(Map.of("message", "Verification email sent successfully. Please check your inbox."));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        authService.verifyEmailToken(token);
        return ResponseEntity.ok(Map.of("message", "Email address verified successfully!"));
    }

    private void setCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        boolean secure = appProperties.getAuth().isCookieSecure();
        String sameSite = appProperties.getAuth().getCookieSameSite();
        
        long accessMaxAge = appProperties.getAuth().getJwtAccessExpiration() / 1000;
        long refreshMaxAge = appProperties.getAuth().getJwtRefreshExpiration() / 1000;

        ResponseCookie accessCookie = ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(Duration.ofSeconds(accessMaxAge))
                .sameSite(sameSite)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(Duration.ofSeconds(refreshMaxAge))
                .sameSite(sameSite)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private void clearCookies(HttpServletResponse response) {
        boolean secure = appProperties.getAuth().isCookieSecure();
        String sameSite = appProperties.getAuth().getCookieSameSite();

        ResponseCookie accessCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite(sameSite)
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite(sameSite)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }
}
