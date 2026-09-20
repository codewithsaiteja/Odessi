package com.odessi.api.dto.response;

import java.time.Instant;

public record CategoryResponse(
    Long id,
    String name,
    String slug,
    String description,
    String image,
    boolean active,
    int productCount,
    Instant createdAt
) {}
