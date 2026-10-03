package com.odessi.api.dto.response;

public record VerifyResetOtpResponse(
    boolean success,
    String message,
    String resetToken,
    long expiresInSeconds
) {}
