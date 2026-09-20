package com.odessi.api.controller;

import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.User;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.ReferralService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/referral")
public class ReferralController {

    private final ReferralService referralService;
    private final AuthService authService;

    public ReferralController(ReferralService referralService, AuthService authService) {
        this.referralService = referralService;
        this.authService = authService;
    }

    @GetMapping("/my-code")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReferralResponse>> getMyReferralCode() {
        User user = authService.getCurrentUser();
        ReferralResponse response = referralService.getMyReferralCode(user);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
