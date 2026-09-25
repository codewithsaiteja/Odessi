package com.odessi.api.dto.response;

import com.odessi.api.entity.ProductStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProductResponse(
    Long id,
    String name,
    String slug,
    String description,
    String shortDescription,
    BigDecimal price,
    BigDecimal compareAtPrice,
    String currency,
    CategoryResponse category,
    CollectionResponse collection,
    String material,
    String fit,
    String careInstructions,
    boolean featured,
    boolean bestseller,
    boolean newArrival,
    boolean active,
    ProductStatus status,
    List<ProductVariantResponse> variants,
    List<ProductImageResponse> images,
    List<String> imageUrls,
    Instant createdAt,
    Instant updatedAt,
    Double averageRating,
    Integer reviewCount
) {
    public ProductResponse(
        Long id, String name, String slug, String description, String shortDescription,
        BigDecimal price, BigDecimal compareAtPrice, String currency,
        CategoryResponse category, CollectionResponse collection,
        String material, String fit, String careInstructions,
        boolean featured, boolean bestseller, boolean newArrival, boolean active,
        ProductStatus status,
        List<ProductVariantResponse> variants, List<ProductImageResponse> images,
        List<String> imageUrls, Instant createdAt, Instant updatedAt
    ) {
        this(id, name, slug, description, shortDescription, price, compareAtPrice, currency,
             category, collection, material, fit, careInstructions, featured, bestseller,
             newArrival, active, status, variants, images, imageUrls, createdAt, updatedAt, null, 0);
    }

    public ProductResponse(
        Long id, String name, String slug, String description, String shortDescription,
        BigDecimal price, BigDecimal compareAtPrice, String currency,
        CategoryResponse category, CollectionResponse collection,
        String material, String fit, String careInstructions,
        boolean featured, boolean bestseller, boolean newArrival, boolean active,
        List<ProductVariantResponse> variants, List<ProductImageResponse> images,
        List<String> imageUrls, Instant createdAt, Instant updatedAt
    ) {
        this(id, name, slug, description, shortDescription, price, compareAtPrice, currency,
             category, collection, material, fit, careInstructions, featured, bestseller,
             newArrival, active, active ? ProductStatus.PUBLISHED : ProductStatus.ARCHIVED,
             variants, images, imageUrls, createdAt, updatedAt, null, 0);
    }

    public ProductResponse withRating(Double averageRating, Integer reviewCount) {
        return new ProductResponse(
            id, name, slug, description, shortDescription, price, compareAtPrice, currency,
            category, collection, material, fit, careInstructions, featured, bestseller,
            newArrival, active, status, variants, images, imageUrls, createdAt, updatedAt,
            averageRating, reviewCount
        );
    }
}
