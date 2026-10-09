package com.odessi.api.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SellerRewardClaimRequest(
    @JsonAlias({"fullName", "shippingFullName"})
    @NotBlank(message = "Recipient full name is required")
    @Size(max = 150)
    String fullName,

    @JsonAlias({"phone", "shippingPhone"})
    @NotBlank(message = "Contact phone number is required")
    @Size(max = 50)
    String phone,

    @JsonAlias({"addressLine1", "shippingAddressLine1"})
    @NotBlank(message = "Address line 1 is required")
    @Size(max = 255)
    String addressLine1,

    @JsonAlias({"addressLine2", "shippingAddressLine2"})
    String addressLine2,

    @JsonAlias({"city", "shippingCity"})
    @NotBlank(message = "City is required")
    @Size(max = 100)
    String city,

    @JsonAlias({"state", "shippingState"})
    @NotBlank(message = "State is required")
    @Size(max = 100)
    String state,

    @JsonAlias({"postalCode", "shippingPostalCode"})
    @NotBlank(message = "Postal code is required")
    @Size(max = 20)
    String postalCode,

    String tshirtSize
) {}
