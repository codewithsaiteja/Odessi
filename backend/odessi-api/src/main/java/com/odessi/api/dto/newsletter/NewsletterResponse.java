package com.odessi.api.dto.newsletter;

import java.time.Instant;

public record NewsletterResponse(
        Long id,
        String email,
        boolean active,
        String source,
        String couponCode,
        String message,
        Instant createdAt
) {
}
