package com.odessi.api.dto.response;

import java.time.Instant;

public record CollectionResponse(
    Long id,
    String name,
    String slug,
    String description,
    String heroImage,
    boolean active,
    boolean featured,
    int productCount,
    Instant createdAt
) {}
