package com.odessi.api.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SellerApplyRequest(
    @NotBlank(message = "Full name is required")
    @Size(max = 150, message = "Full name cannot exceed 150 characters")
    String fullName,

    @NotBlank(message = "Email is required")
    @Size(max = 255, message = "Email cannot exceed 255 characters")
    String email,

    @NotBlank(message = "Phone number is required")
    @Size(max = 50, message = "Phone cannot exceed 50 characters")
    String phone,

    @NotBlank(message = "Social media or sales channel is required")
    @Size(max = 255, message = "Social channel cannot exceed 255 characters")
    String socialChannel,

    @NotBlank(message = "Reason for joining is required")
    String applicationReason,

    @JsonAlias({"agreeToTerms", "termsAccepted"})
    @NotNull(message = "Must accept terms")
    Boolean termsAccepted
) {}
