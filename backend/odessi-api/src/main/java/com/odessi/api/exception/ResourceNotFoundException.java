package com.odessi.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    private final String errorCode;

    public ResourceNotFoundException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }

    // ── Factory methods ───────────────────────────────────────────

    public static ResourceNotFoundException product(String slug) {
        return new ResourceNotFoundException("PRODUCT_NOT_FOUND",
            "Product not found with slug: " + slug);
    }

    public static ResourceNotFoundException productById(Long id) {
        return new ResourceNotFoundException("PRODUCT_NOT_FOUND",
            "Product not found with id: " + id);
    }

    public static ResourceNotFoundException variant(Long id) {
        return new ResourceNotFoundException("VARIANT_NOT_FOUND",
            "Product variant not found with id: " + id);
    }

    public static ResourceNotFoundException category(String slug) {
        return new ResourceNotFoundException("CATEGORY_NOT_FOUND",
            "Category not found with slug: " + slug);
    }

    public static ResourceNotFoundException collection(String slug) {
        return new ResourceNotFoundException("COLLECTION_NOT_FOUND",
            "Collection not found with slug: " + slug);
    }

    public static ResourceNotFoundException cart(Long userId) {
        return new ResourceNotFoundException("CART_NOT_FOUND",
            "Cart not found for user: " + userId);
    }

    public static ResourceNotFoundException cartItem(Long id) {
        return new ResourceNotFoundException("CART_ITEM_NOT_FOUND",
            "Cart item not found with id: " + id);
    }

    public static ResourceNotFoundException wishlist(Long userId) {
        return new ResourceNotFoundException("WISHLIST_NOT_FOUND",
            "Wishlist not found for user: " + userId);
    }

    public static ResourceNotFoundException address(Long id) {
        return new ResourceNotFoundException("ADDRESS_NOT_FOUND",
            "Address not found with id: " + id);
    }

    public static ResourceNotFoundException order(String orderNumber) {
        return new ResourceNotFoundException("ORDER_NOT_FOUND",
            "Order not found with order number: " + orderNumber);
    }

    public static ResourceNotFoundException user(Long id) {
        return new ResourceNotFoundException("USER_NOT_FOUND",
            "User not found with id: " + id);
    }
}
