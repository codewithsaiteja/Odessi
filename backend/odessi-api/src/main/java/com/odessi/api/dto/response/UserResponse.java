package com.odessi.api.dto.response;

import com.odessi.api.entity.Role;

import java.time.Instant;

/**
 * Public-facing user representation.
 * passwordHash is deliberately ABSENT from this record.
 */
public record UserResponse(
    Long id,
    String firstName,
    String lastName,
    String email,
    String phone,
    Role role,
    boolean enabled,
    boolean emailVerified,
    Instant createdAt
) {}
