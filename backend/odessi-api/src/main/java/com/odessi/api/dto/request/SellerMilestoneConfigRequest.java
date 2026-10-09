package com.odessi.api.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SellerMilestoneConfigRequest(
    @NotNull(message = "Tier level is required")
    @Min(value = 1, message = "Tier level must be positive")
    Integer tierLevel,

    @NotBlank(message = "Milestone name is required")
    @Size(max = 100, message = "Milestone name cannot exceed 100 characters")
    String milestoneName,

    @NotNull(message = "Qualifying sales threshold is required")
    @Min(value = 1, message = "Threshold must be greater than zero")
    Integer qualifyingSalesThreshold,

    @NotBlank(message = "Reward title is required")
    @Size(max = 150, message = "Reward title cannot exceed 150 characters")
    String rewardTitle,

    @NotBlank(message = "Reward description is required")
    String rewardDescription,

    String rewardType,
    String imageUrl,
    Boolean active
) {}
