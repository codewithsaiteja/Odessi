package com.odessi.api.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record AdminCollectionRequest(
    @NotBlank(message = "Collection name is required")
    String name,

    String slug,

    String description,

    String heroImage,

    boolean active,

    boolean featured
) {}
