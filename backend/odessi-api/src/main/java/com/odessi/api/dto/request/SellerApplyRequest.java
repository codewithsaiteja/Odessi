package com.odessi.api.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
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

    @JsonProperty("termsAccepted")
    Boolean termsAccepted,

    @JsonProperty("agreeToTerms")
    Boolean agreeToTerms
) {
    public SellerApplyRequest(String fullName, String email, String phone, String socialChannel, String applicationReason, Boolean termsAccepted) {
        this(fullName, email, phone, socialChannel, applicationReason, termsAccepted, termsAccepted);
    }

    public boolean isTermsAccepted() {
        return Boolean.TRUE.equals(termsAccepted) || Boolean.TRUE.equals(agreeToTerms);
    }
}

