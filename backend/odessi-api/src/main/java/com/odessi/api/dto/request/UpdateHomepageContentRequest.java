package com.odessi.api.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateHomepageContentRequest(
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    String title,

    @Size(max = 200, message = "Eyebrow cannot exceed 200 characters")
    String eyebrow,

    String headline,

    String subHeadline,

    String body,

    @Size(max = 100, message = "Primary CTA label cannot exceed 100 characters")
    String primaryCtaLabel,

    @Size(max = 255, message = "Primary CTA URL cannot exceed 255 characters")
    String primaryCtaUrl,

    @Size(max = 100, message = "Secondary CTA label cannot exceed 100 characters")
    String secondaryCtaLabel,

    @Size(max = 255, message = "Secondary CTA URL cannot exceed 255 characters")
    String secondaryCtaUrl,

    @Size(max = 500, message = "Media URL cannot exceed 500 characters")
    String mediaUrl,

    @Size(max = 500, message = "Mobile media URL cannot exceed 500 characters")
    String mobileMediaUrl,

    Boolean active,

    String customPayload
) {}
