package com.odessi.api.dto.response;

import java.time.Instant;

public record LoyaltyAccountResponse(
    Long userId,
    String email,
    String tier,
    String status,
    Instant memberSince
) {}
