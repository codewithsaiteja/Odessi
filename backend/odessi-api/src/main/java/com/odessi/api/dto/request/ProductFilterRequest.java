package com.odessi.api.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * Query parameters for GET /api/products.
 * Bound as @ModelAttribute from the HTTP query string.
 *
 * <p>Note: the {@code clothingSize} parameter maps to the product variant size (e.g. S/M/L/XL).
 * {@code pageSize} maps to the pagination page size.
 * These were previously both named "size", causing a type-mismatch compilation error.
 */
public record ProductFilterRequest(

    String category,
    String collection,

    /** Clothing size filter (e.g. "S", "M", "L", "XL"). */
    String clothingSize,
    String color,

    @DecimalMin(value = "0", message = "minPrice cannot be negative")
    java.math.BigDecimal minPrice,

    @DecimalMin(value = "0", message = "maxPrice cannot be negative")
    java.math.BigDecimal maxPrice,

    Boolean available,
    Boolean featured,
    Boolean bestseller,
    Boolean newArrival,

    @Size(max = 200)
    String search,

    /**
     * Sort options: featured | newest | price_low | price_high | bestselling
     */
    String sort,

    @Min(0)
    Integer page,

    @Min(1)
    Integer pageSize

) {
    /** Defaults applied when query params are absent. */
    public ProductFilterRequest withDefaults() {
        return new ProductFilterRequest(
            category, collection, clothingSize, color,
            minPrice, maxPrice,
            available, featured, bestseller, newArrival,
            search,
            sort != null ? sort : "newest",
            page != null ? page : 0,
            pageSize != null ? pageSize : 20
        );
    }
}
