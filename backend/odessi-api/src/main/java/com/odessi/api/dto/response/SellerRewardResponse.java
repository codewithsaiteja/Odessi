package com.odessi.api.dto.response;

import com.odessi.api.entity.SellerReward;
import com.odessi.api.entity.SellerRewardStatus;
import java.time.Instant;

public record SellerRewardResponse(
    Long id,
    Long sellerId,
    Long milestoneConfigId,
    int tierLevel,
    String milestoneNameSnapshot,
    String rewardTitleSnapshot,
    String rewardDescriptionSnapshot,
    int qualifyingSalesAtUnlock,
    SellerRewardStatus status,
    Instant unlockedAt,
    Instant claimedAt,
    String shippingFullName,
    String shippingPhone,
    String shippingAddressLine1,
    String shippingAddressLine2,
    String shippingCity,
    String shippingState,
    String shippingPostalCode,
    String tshirtSize,
    String shippingCarrier,
    String trackingNumber,
    String trackingUrl,
    Instant dispatchedAt,
    Instant deliveredAt,
    String adminNotes
) {
    public static SellerRewardResponse fromEntity(SellerReward r) {
        if (r == null) return null;
        return new SellerRewardResponse(
            r.getId(),
            r.getSeller() != null ? r.getSeller().getId() : null,
            r.getMilestoneConfig() != null ? r.getMilestoneConfig().getId() : null,
            r.getTierLevel(),
            r.getMilestoneNameSnapshot(),
            r.getRewardTitleSnapshot(),
            r.getRewardDescriptionSnapshot(),
            r.getQualifyingSalesAtUnlock(),
            r.getStatus(),
            r.getUnlockedAt(),
            r.getClaimedAt(),
            r.getShippingFullName(),
            r.getShippingPhone(),
            r.getShippingAddressLine1(),
            r.getShippingAddressLine2(),
            r.getShippingCity(),
            r.getShippingState(),
            r.getShippingPostalCode(),
            r.getTshirtSize(),
            r.getShippingCarrier(),
            r.getTrackingNumber(),
            r.getTrackingUrl(),
            r.getDispatchedAt(),
            r.getDeliveredAt(),
            r.getAdminNotes()
        );
    }
}
