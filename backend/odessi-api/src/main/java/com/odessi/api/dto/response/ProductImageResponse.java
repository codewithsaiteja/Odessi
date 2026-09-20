package com.odessi.api.dto.response;

import java.time.Instant;

public record ProductImageResponse(
    Long id,
    Long productId,
    String imageUrl,
    String altText,
    int sortOrder,
    boolean isPrimary,
    String mediaType,
    String videoUrl,
    String posterUrl,
    Instant createdAt
) {}
