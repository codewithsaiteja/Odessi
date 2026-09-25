package com.odessi.api.dto.response;

public record TryOnTokenResponse(
    String clientToken,
    String expiresAt,
    String model,
    String garmentImageUrl,
    String productName
) {}
