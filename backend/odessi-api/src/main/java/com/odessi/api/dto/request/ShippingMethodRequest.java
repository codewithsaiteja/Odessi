package com.odessi.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record ShippingMethodRequest(
    @NotBlank(message = "Shipping method name is required")
    String name,

    @NotBlank(message = "Shipping method code is required")
    String code,

    @NotNull(message = "Charge is required")
    @PositiveOrZero(message = "Charge must be >= 0")
    BigDecimal charge,

    @PositiveOrZero(message = "Free shipping threshold must be >= 0")
    BigDecimal freeShippingThreshold,

    String estimatedDays,

    Boolean active
) {}
