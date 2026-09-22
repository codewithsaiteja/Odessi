package com.odessi.api.controller;

import com.odessi.api.dto.newsletter.NewsletterResponse;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.service.NewsletterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/newsletter")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Newsletter", description = "Admin endpoints for newsletter subscribers")
public class AdminNewsletterController {

    private final NewsletterService newsletterService;

    public AdminNewsletterController(NewsletterService newsletterService) {
        this.newsletterService = newsletterService;
    }

    @GetMapping("/subscribers")
    @Operation(summary = "List all newsletter subscribers")
    public ResponseEntity<ApiResponse<List<NewsletterResponse>>> getSubscribers() {
        return ResponseEntity.ok(ApiResponse.ok(newsletterService.getAllSubscribers()));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get newsletter subscription stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        long count = newsletterService.getActiveSubscriberCount();
        return ResponseEntity.ok(ApiResponse.ok(Map.of("activeCount", count)));
    }
}
