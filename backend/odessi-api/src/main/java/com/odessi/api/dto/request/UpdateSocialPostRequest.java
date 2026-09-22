package com.odessi.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSocialPostRequest(
    @NotBlank(message = "Media URL is required")
    @Size(max = 500, message = "Media URL cannot exceed 500 characters")
    String mediaUrl,

    @Size(max = 500, message = "Instagram URL cannot exceed 500 characters")
    String instagramUrl,

    String caption,

    @Size(max = 150, message = "Title cannot exceed 150 characters")
    String title,

    Long productId,

    Long collectionId,

    Boolean published,

    Integer displayOrder
) {}
