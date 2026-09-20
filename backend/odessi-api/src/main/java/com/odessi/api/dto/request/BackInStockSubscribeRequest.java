package com.odessi.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BackInStockSubscribeRequest(
    @NotNull(message = "Product ID is required")
    Long productId,

    @NotNull(message = "Variant ID is required")
    Long variantId,

    @NotBlank(message = "Email address is required")
    @Email(message = "Please provide a valid email address")
    String email
) {}
