package com.odessi.api.dto.request;

import jakarta.validation.constraints.NotNull;

public record AddWishlistItemRequest(

    @NotNull(message = "Product ID is required")
    Long productId
) {}
