package com.odessi.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateAddressRequest(

    @NotBlank(message = "Full name is required")
    @Size(max = 200)
    String fullName,

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+]?[0-9]{7,15}$", message = "Invalid phone number")
    String phone,

    @NotBlank(message = "Address line 1 is required")
    @Size(max = 300)
    String addressLine1,

    @Size(max = 300)
    String addressLine2,

    @NotBlank(message = "City is required")
    @Size(max = 100)
    String city,

    @NotBlank(message = "State is required")
    @Size(max = 100)
    String state,

    @NotBlank(message = "Postal code is required")
    @Pattern(regexp = "^[a-zA-Z0-9\\s-]{3,10}$", message = "Invalid PIN or postal code")
    String postalCode,

    @Size(max = 100)
    String country,

    boolean isDefault
) {}
