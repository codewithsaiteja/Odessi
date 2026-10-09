package com.odessi.api.dto.response;

import com.odessi.api.entity.SellerAttribution;
import java.math.BigDecimal;
import java.time.Instant;

public record SellerAttributionResponse(
    Long id,
    Long orderId,
    String orderNumber,
    BigDecimal orderTotal,
    Long sellerId,
    String sellerCodeUsed,
    String customerEmail,
    String customerName,
    boolean isQualifying,
    String qualificationStatus,
    String qualificationReason,
    Instant createdAt,
    Instant qualifiedAt
) {
    public static SellerAttributionResponse fromEntity(SellerAttribution a) {
        if (a == null) return null;
        return new SellerAttributionResponse(
            a.getId(),
            a.getOrder() != null ? a.getOrder().getId() : null,
            a.getOrderNumber(),
            a.getOrderTotal(),
            a.getSeller() != null ? a.getSeller().getId() : null,
            a.getSellerCodeUsed(),
            a.getCustomer() != null ? a.getCustomer().getEmail() : null,
            a.getCustomer() != null ? (a.getCustomer().getFirstName() + " " + a.getCustomer().getLastName()).trim() : null,
            a.isQualifying(),
            a.getQualificationStatus(),
            a.getQualificationReason(),
            a.getCreatedAt(),
            a.getQualifiedAt()
        );
    }
}
