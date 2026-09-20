package com.odessi.api.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** All fields optional — PATCH semantics. */
public record UpdateAddressRequest(

    @Size(max = 200)
    String fullName,

    @Pattern(regexp = "^[+]?[0-9]{7,15}$", message = "Invalid phone number")
    String phone,

    @Size(max = 300)
    String addressLine1,

    @Size(max = 300)
    String addressLine2,

    @Size(max = 100)
    String city,

    @Size(max = 100)
    String state,

    @Pattern(regexp = "^[a-zA-Z0-9\\s-]{3,10}$", message = "Invalid PIN or postal code")
    String postalCode,

    @Size(max = 100)
    String country,

    Boolean isDefault
) {}
