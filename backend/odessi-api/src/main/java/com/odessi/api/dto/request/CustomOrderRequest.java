package com.odessi.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CustomOrderRequest(
    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    String name,

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    String email,

    @NotBlank(message = "Phone is required")
    @Size(max = 30, message = "Phone cannot exceed 30 characters")
    String phone,

    @Size(max = 150, message = "Organization cannot exceed 150 characters")
    String organization,

    @NotBlank(message = "Order type is required")
    @Size(max = 50, message = "Order type cannot exceed 50 characters")
    String orderType,

    @NotNull(message = "Approximate quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    Integer approximateQuantity,

    @Size(max = 150, message = "Preferred product cannot exceed 150 characters")
    String preferredProduct,

    @Size(max = 2000, message = "Customization requirement cannot exceed 2000 characters")
    String customizationRequirement,

    @Size(max = 50, message = "Expected delivery date cannot exceed 50 characters")
    String expectedDeliveryDate,

    @Size(max = 2000, message = "Message cannot exceed 2000 characters")
    String message
) {}
