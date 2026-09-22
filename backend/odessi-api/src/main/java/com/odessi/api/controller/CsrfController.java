package com.odessi.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Exposes a CSRF token endpoint so cross-origin clients (Vercel → Render)
 * can retrieve a valid CSRF token before performing state-changing requests.
 *
 * <p>Because the Vercel frontend runs on a different domain from the Render backend,
 * JavaScript on Vercel cannot read the {@code XSRF-TOKEN} cookie set by Render
 * via {@code document.cookie} (Same-Origin Policy). This endpoint bridges the gap
 * without weakening CSRF protection:
 *
 * <ol>
 *   <li>Frontend calls {@code GET /api/csrf} with {@code credentials: "include"}.</li>
 *   <li>Spring Security's {@link org.springframework.security.web.csrf.CookieCsrfTokenRepository}
 *       writes the {@code XSRF-TOKEN} cookie and resolves the token into the request attribute.</li>
 *   <li>This endpoint reads the token from the request attribute and returns it as JSON.</li>
 *   <li>Frontend caches the token in memory and attaches {@code X-XSRF-TOKEN: <token>}
 *       to all subsequent state-changing requests ({@code POST}, {@code PUT}, {@code PATCH},
 *       {@code DELETE}, multipart uploads).</li>
 * </ol>
 *
 * <p>The endpoint is {@code permitAll()} because retrieving a CSRF token is not a state-changing
 * operation. Unauthenticated callers get a valid CSRF token; admin actions still require
 * both the CSRF header and a valid JWT cookie.
 *
 * <p><b>Security note</b>: This does NOT bypass CSRF protection. Spring Security still validates
 * the {@code X-XSRF-TOKEN} header against the cookie on every state-changing request.
 */
@RestController
@RequestMapping("/api/csrf")
@Tag(name = "CSRF", description = "Cross-origin CSRF token acquisition for Vercel → Render flow")
public class CsrfController {

    @GetMapping
    @Operation(
        summary = "Acquire CSRF token",
        description = "Returns the current CSRF token. Call before any state-changing request. " +
                      "Must be called with credentials:include so the XSRF-TOKEN cookie is set."
    )
    public ResponseEntity<Map<String, String>> getCsrfToken(HttpServletRequest request) {
        // Spring Security's CookieCsrfTokenRepository loads the token into the request attribute
        // when the CSRF filter processes this request. Calling getAttribute forces token generation.
        CsrfToken csrf = (CsrfToken) request.getAttribute(CsrfToken.class.getName());

        if (csrf == null) {
            // Fallback: try the default attribute name
            csrf = (CsrfToken) request.getAttribute("_csrf");
        }

        if (csrf == null) {
            // Should never happen with CookieCsrfTokenRepository, but return a safe error
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "CSRF_UNAVAILABLE", "message", "CSRF token unavailable"));
        }

        // Access token value to trigger deferred token loading (Spring Security 6 lazy evaluation)
        String tokenValue = csrf.getToken();

        return ResponseEntity.ok(Map.of(
                "token",         tokenValue,
                "headerName",    csrf.getHeaderName(),
                "parameterName", csrf.getParameterName()
        ));
    }
}
