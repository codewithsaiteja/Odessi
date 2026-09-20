package com.odessi.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PartnershipRequest(
    @NotBlank(message = "Business name is required")
    @Size(max = 150, message = "Business name cannot exceed 150 characters")
    String businessName,

    @NotBlank(message = "Contact person is required")
    @Size(max = 100, message = "Contact person cannot exceed 100 characters")
    String contactPerson,

    @NotBlank(message = "Phone number is required")
    @Size(max = 30, message = "Phone number cannot exceed 30 characters")
    String phone,

    @NotBlank(message = "Email address is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    String email,

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City cannot exceed 100 characters")
    String city,

    @NotBlank(message = "State is required")
    @Size(max = 100, message = "State cannot exceed 100 characters")
    String state,

    @NotBlank(message = "Business type is required")
    @Size(max = 50, message = "Business type cannot exceed 50 characters")
    String businessType,

    @Size(max = 100, message = "Estimated requirement cannot exceed 100 characters")
    String estimatedMonthlyRequirement,

    @Size(max = 255, message = "Website/Instagram cannot exceed 255 characters")
    String websiteInstagram,

    @Size(max = 2000, message = "Message cannot exceed 2000 characters")
    String message
) {}
