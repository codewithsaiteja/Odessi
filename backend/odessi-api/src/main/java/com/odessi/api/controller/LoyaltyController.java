package com.odessi.api.controller;

import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.LoyaltyAccountResponse;
import com.odessi.api.entity.User;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.LoyaltyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/loyalty")
public class LoyaltyController {

    private final LoyaltyService loyaltyService;
    private final AuthService authService;

    public LoyaltyController(LoyaltyService loyaltyService, AuthService authService) {
        this.loyaltyService = loyaltyService;
        this.authService = authService;
    }

    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LoyaltyAccountResponse>> getStatus() {
        User user = authService.getCurrentUser();
        LoyaltyAccountResponse response = loyaltyService.getStatus(user);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
