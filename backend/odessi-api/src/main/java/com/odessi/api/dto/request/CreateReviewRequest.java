package com.odessi.api.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateReviewRequest(
    Long orderId,

    @NotNull(message = "Rating score is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    Integer rating,

    String title,

    @NotBlank(message = "Review comment is required")
    String comment,

    Boolean recommended
) {
    public CreateReviewRequest(Long orderId, Integer rating, String title, String comment) {
        this(orderId, rating, title, comment, true);
    }
}
