package com.odessi.api.controller;

import com.odessi.api.dto.request.AddCartItemRequest;
import com.odessi.api.dto.request.MergeCartRequest;
import com.odessi.api.dto.request.UpdateCartItemRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.CartResponse;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@Tag(name = "Cart", description = "Shopping cart management")
public class CartController {

    private final CartService cartService;
    private final AuthService authService;

    public CartController(CartService cartService, AuthService authService) {
        this.cartService = cartService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get current user's cart")
    public ResponseEntity<ApiResponse<CartResponse>> getCart() {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(ApiResponse.ok(cartService.getCart(userId)));
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to cart")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(@Valid @RequestBody AddCartItemRequest request) {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(cartService.addItem(userId, request)));
    }

    @PatchMapping("/items/{itemId}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(ApiResponse.ok(cartService.updateItem(userId, itemId, request)));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Remove item from cart")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(@PathVariable Long itemId) {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(ApiResponse.ok(cartService.removeItem(userId, itemId), "Item removed"));
    }

    @PostMapping("/merge")
    @Operation(summary = "Merge guest cart with server cart upon login")
    public ResponseEntity<ApiResponse<CartResponse>> mergeCart(@Valid @RequestBody MergeCartRequest request) {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(ApiResponse.ok(cartService.mergeCart(userId, request), "Cart merged"));
    }
}
