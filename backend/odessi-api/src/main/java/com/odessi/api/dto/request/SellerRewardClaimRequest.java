package com.odessi.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SellerRewardClaimRequest(
    @NotBlank(message = "Recipient full name is required")
    @Size(max = 150)
    String fullName,

    @NotBlank(message = "Contact phone number is required")
    @Size(max = 50)
    String phone,

    @NotBlank(message = "Address line 1 is required")
    @Size(max = 255)
    String addressLine1,

    String addressLine2,

    @NotBlank(message = "City is required")
    @Size(max = 100)
    String city,

    @NotBlank(message = "State is required")
    @Size(max = 100)
    String state,

    @NotBlank(message = "Postal code is required")
    @Size(max = 20)
    String postalCode,

    String tshirtSize
) {}
