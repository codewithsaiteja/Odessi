package com.odessi.api.dto.response;

import com.odessi.api.entity.SellerAuditLog;
import java.time.Instant;

public record SellerAuditLogResponse(
    Long id,
    Long sellerId,
    String adminEmail,
    String action,
    String details,
    Instant createdAt
) {
    public static SellerAuditLogResponse fromEntity(SellerAuditLog log) {
        if (log == null) return null;
        return new SellerAuditLogResponse(
            log.getId(),
            log.getSeller() != null ? log.getSeller().getId() : null,
            log.getAdmin() != null ? log.getAdmin().getEmail() : null,
            log.getAction(),
            log.getDetails(),
            log.getCreatedAt()
        );
    }
}
