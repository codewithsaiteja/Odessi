package com.odessi.api.controller;

import com.odessi.api.dto.request.TryOnTokenRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.TryOnConfigResponse;
import com.odessi.api.dto.response.TryOnTokenResponse;
import com.odessi.api.service.DecartTryOnService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/try-on")
@Tag(name = "Virtual Try-On", description = "Decart Lucy Realtime Virtual Try-On Integration")
public class TryOnController {

    private final DecartTryOnService tryOnService;

    public TryOnController(DecartTryOnService tryOnService) {
        this.tryOnService = tryOnService;
    }

    @GetMapping("/config")
    @Operation(summary = "Check Virtual Try-On configuration", description = "Returns whether Decart Lucy VTON is enabled and configured without revealing secrets")
    public ResponseEntity<ApiResponse<TryOnConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.ok(tryOnService.getConfig()));
    }

    @PostMapping("/token")
    @Operation(summary = "Request ephemeral Decart client token", description = "Generates a short-lived client credential bound to the current product garment")
    public ResponseEntity<ApiResponse<TryOnTokenResponse>> createToken(
            @RequestBody TryOnTokenRequest request,
            HttpServletRequest servletRequest
    ) {
        String clientIp = resolveClientIp(servletRequest);
        TryOnTokenResponse response = tryOnService.createClientToken(request, clientIp);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String cfIp = request.getHeader("CF-Connecting-IP");
        if (cfIp != null && !cfIp.isBlank()) return cfIp.trim();

        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
