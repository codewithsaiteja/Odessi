package com.odessi.api.dto.response;

import com.odessi.api.entity.SellerMilestoneConfig;

public record SellerMilestoneConfigResponse(
    Long id,
    int tierLevel,
    String milestoneName,
    int qualifyingSalesThreshold,
    String rewardTitle,
    String rewardDescription,
    String rewardType,
    String imageUrl,
    boolean active,
    int version
) {
    public static SellerMilestoneConfigResponse fromEntity(SellerMilestoneConfig c) {
        if (c == null) return null;
        return new SellerMilestoneConfigResponse(
            c.getId(),
            c.getTierLevel(),
            c.getMilestoneName(),
            c.getQualifyingSalesThreshold(),
            c.getRewardTitle(),
            c.getRewardDescription(),
            c.getRewardType(),
            c.getImageUrl(),
            c.isActive(),
            c.getVersion()
        );
    }
}
