package com.odessi.api.dto.response;

import java.util.List;

public record SellerDashboardResponse(
    SellerResponse seller,
    int verifiedSales,
    int pendingOrders,
    SellerMilestoneConfigResponse currentMilestone,
    SellerMilestoneConfigResponse nextMilestone,
    int remainingSalesToNextMilestone,
    double progressPercent,
    List<SellerMilestoneConfigResponse> milestones,
    List<SellerRewardResponse> rewards,
    String shareableLink
) {}
