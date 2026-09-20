package com.odessi.api.dto.response;

import java.time.Instant;

public record PartnershipResponse(
    Long id,
    String businessName,
    String contactPerson,
    String phone,
    String email,
    String city,
    String state,
    String businessType,
    String estimatedMonthlyRequirement,
    String websiteInstagram,
    String message,
    String status,
    String internalNotes,
    Instant createdAt,
    Instant updatedAt
) {}
