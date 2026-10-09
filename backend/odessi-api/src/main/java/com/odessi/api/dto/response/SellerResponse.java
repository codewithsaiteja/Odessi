package com.odessi.api.dto.response;

import com.odessi.api.entity.Seller;
import com.odessi.api.entity.SellerStatus;
import java.time.Instant;

public record SellerResponse(
    Long id,
    Long userId,
    String sellerCode,
    String fullName,
    String email,
    String phone,
    String socialChannel,
    String applicationReason,
    SellerStatus status,
    String rejectionReason,
    String suspensionReason,
    int verifiedSalesCount,
    Instant createdAt,
    Instant approvedAt,
    Instant rejectedAt,
    Instant suspendedAt
) {
    public static SellerResponse fromEntity(Seller s) {
        if (s == null) return null;
        return new SellerResponse(
            s.getId(),
            s.getUser() != null ? s.getUser().getId() : null,
            s.getSellerCode(),
            s.getFullName(),
            s.getEmail(),
            s.getPhone(),
            s.getSocialChannel(),
            s.getApplicationReason(),
            s.getStatus(),
            s.getRejectionReason(),
            s.getSuspensionReason(),
            s.getVerifiedSalesCount(),
            s.getCreatedAt(),
            s.getApprovedAt(),
            s.getRejectedAt(),
            s.getSuspendedAt()
        );
    }
}
