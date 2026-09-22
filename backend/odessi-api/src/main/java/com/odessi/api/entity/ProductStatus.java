package com.odessi.api.entity;

/**
 * Authoritative product lifecycle states for Odessi.tfi catalog items.
 */
public enum ProductStatus {
    DRAFT,
    PUBLISHED,
    HIDDEN,
    ARCHIVED;

    public static ProductStatus fromString(String value) {
        if (value == null || value.isBlank()) {
            return PUBLISHED;
        }
        try {
            return ProductStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid product status '" + value + "'. Allowed values: DRAFT, PUBLISHED, HIDDEN, ARCHIVED"
            );
        }
    }
}
