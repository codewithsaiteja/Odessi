package com.odessi.api.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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
) {
    /** Canonical media reference alias matching project DTO conventions */
    @JsonProperty("imageUrl")
    public String imageUrl() {
        return image;
    }
}
