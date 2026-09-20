package com.odessi.api.dto.admin;

import java.time.Instant;

public record AdminAuditLogResponse(
    Long id,
    Long adminId,
    String adminEmail,
    String action,
    String entityType,
    String entityId,
    String details,
    Instant createdAt
) {}
