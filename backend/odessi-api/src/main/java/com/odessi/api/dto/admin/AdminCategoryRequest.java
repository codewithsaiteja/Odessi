package com.odessi.api.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record AdminCategoryRequest(
    @NotBlank(message = "Category name is required")
    String name,

    String slug,

    String description,

    String image,

    boolean active
) {}
