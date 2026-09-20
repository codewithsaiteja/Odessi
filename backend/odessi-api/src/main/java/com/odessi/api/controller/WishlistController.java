package com.odessi.api.controller;

import com.odessi.api.dto.request.AddWishlistItemRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.WishlistResponse;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.WishlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@Tag(name = "Wishlist", description = "Wishlist management")
public class WishlistController {

    private final WishlistService wishlistService;
    private final AuthService authService;

    public WishlistController(WishlistService wishlistService, AuthService authService) {
        this.wishlistService = wishlistService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get current user's wishlist")
    public ResponseEntity<ApiResponse<WishlistResponse>> getWishlist() {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(ApiResponse.ok(wishlistService.getWishlist(userId)));
    }

    @PostMapping("/items")
    @Operation(summary = "Add product to wishlist")
    public ResponseEntity<ApiResponse<WishlistResponse>> addItem(@Valid @RequestBody AddWishlistItemRequest request) {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(wishlistService.addItem(userId, request)));
    }

    @DeleteMapping("/items/{productId}")
    @Operation(summary = "Remove product from wishlist")
    public ResponseEntity<ApiResponse<WishlistResponse>> removeItem(@PathVariable Long productId) {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(ApiResponse.ok(
            wishlistService.removeItem(userId, productId), "Removed from wishlist"));
    }
}
