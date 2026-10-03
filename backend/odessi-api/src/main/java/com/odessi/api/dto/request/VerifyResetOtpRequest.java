package com.odessi.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyResetOtpRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Verification code is required")
    @Pattern(regexp = "^\\d{6}$", message = "Verification code must be exactly 6 digits")
    String otp
) {}
