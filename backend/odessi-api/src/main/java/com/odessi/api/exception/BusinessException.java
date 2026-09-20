package com.odessi.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Domain/business rule violations — HTTP 422 Unprocessable Entity.
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class BusinessException extends RuntimeException {

    private final String errorCode;

    public BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }

    // ── Factory methods ───────────────────────────────────────────

    public static BusinessException insufficientStock(String sku, int requested, int available) {
        return new BusinessException("INSUFFICIENT_STOCK",
            String.format("Insufficient stock for SKU '%s': requested %d, available %d",
                sku, requested, available));
    }

    public static BusinessException variantUnavailable(String sku) {
        return new BusinessException("VARIANT_UNAVAILABLE",
            "Product variant is not available: " + sku);
    }

    public static BusinessException duplicateWishlistItem() {
        return new BusinessException("DUPLICATE_WISHLIST_ITEM",
            "This product is already in your wishlist");
    }

    public static BusinessException duplicateSlug(String slug) {
        return new BusinessException("DUPLICATE_SLUG",
            "A resource with slug '" + slug + "' already exists");
    }

    public static BusinessException duplicateSku(String sku) {
        return new BusinessException("DUPLICATE_SKU",
            "A variant with SKU '" + sku + "' already exists");
    }

    public static BusinessException duplicateEmail(String email) {
        return new BusinessException("DUPLICATE_EMAIL",
            "An account with email '" + email + "' already exists");
    }

    public static BusinessException cartEmpty() {
        return new BusinessException("CART_EMPTY",
            "Cannot create order from an empty cart");
    }

    public static BusinessException invalidQuantity() {
        return new BusinessException("INVALID_QUANTITY",
            "Quantity must be at least 1");
    }
}
