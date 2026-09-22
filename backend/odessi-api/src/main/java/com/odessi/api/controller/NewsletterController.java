package com.odessi.api.controller;

import com.odessi.api.dto.newsletter.NewsletterResponse;
import com.odessi.api.dto.newsletter.NewsletterSubscribeRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.service.NewsletterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/newsletter")
@Tag(name = "Newsletter", description = "Public newsletter subscription endpoints")
public class NewsletterController {

    private final NewsletterService newsletterService;

    public NewsletterController(NewsletterService newsletterService) {
        this.newsletterService = newsletterService;
    }

    @PostMapping("/subscribe")
    @Operation(summary = "Subscribe to newsletter with welcome coupon issuance")
    public ResponseEntity<ApiResponse<NewsletterResponse>> subscribe(
            @Valid @RequestBody NewsletterSubscribeRequest request) {
        NewsletterResponse response = newsletterService.subscribe(request);
        return ResponseEntity.ok(ApiResponse.ok(response, response.message()));
    }

    @PostMapping("/unsubscribe")
    @Operation(summary = "Unsubscribe from newsletter")
    public ResponseEntity<ApiResponse<Void>> unsubscribe(
            @RequestParam String email) {
        newsletterService.unsubscribe(email);
        return ResponseEntity.ok(ApiResponse.ok(null, "Successfully unsubscribed"));
    }
}
