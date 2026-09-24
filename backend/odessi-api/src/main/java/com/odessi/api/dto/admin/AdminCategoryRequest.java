package com.odessi.api.dto.admin;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record AdminCategoryRequest(
    @NotBlank(message = "Category name is required")
    String name,

    String slug,

    String description,

    @JsonAlias({"imageUrl", "image_url"})
    String image,

    boolean active
) {}
