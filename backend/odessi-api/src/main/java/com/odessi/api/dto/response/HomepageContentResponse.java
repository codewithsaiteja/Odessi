package com.odessi.api.dto.response;

import java.time.Instant;

public record HomepageContentResponse(
    Long id,
    String sectionKey,
    String title,
    String eyebrow,
    String headline,
    String subHeadline,
    String body,
    String primaryCtaLabel,
    String primaryCtaUrl,
    String secondaryCtaLabel,
    String secondaryCtaUrl,
    String mediaUrl,
    String mobileMediaUrl,
    boolean active,
    String customPayload,
    Instant updatedAt
) {}
