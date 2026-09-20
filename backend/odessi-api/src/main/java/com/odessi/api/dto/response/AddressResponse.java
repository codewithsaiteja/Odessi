package com.odessi.api.dto.response;

import java.time.Instant;

public record AddressResponse(
    Long id,
    String fullName,
    String phone,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String country,
    boolean isDefault,
    Instant createdAt
) {}
