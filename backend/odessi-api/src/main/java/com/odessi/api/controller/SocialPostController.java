package com.odessi.api.controller;

import com.odessi.api.dto.response.SocialPostResponse;
import com.odessi.api.service.SocialPostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social/posts")
@Tag(name = "Social Posts", description = "Public curated Instagram and social media content")
public class SocialPostController {

    private final SocialPostService socialPostService;

    public SocialPostController(SocialPostService socialPostService) {
        this.socialPostService = socialPostService;
    }

    @GetMapping
    @Operation(summary = "Get published social posts for storefront Instagram grid")
    public ResponseEntity<List<SocialPostResponse>> getPublishedPosts() {
        return ResponseEntity.ok(socialPostService.getPublishedPosts());
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get social posts featuring a specific product")
    public ResponseEntity<List<SocialPostResponse>> getPostsForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(socialPostService.getPostsForProduct(productId));
    }
}
