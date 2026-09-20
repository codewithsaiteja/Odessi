package com.odessi.api.dto.admin;

import com.odessi.api.dto.response.AddressResponse;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.entity.Role;

import java.time.Instant;
import java.util.List;

public record AdminUserResponse(
    Long id,
    String firstName,
    String lastName,
    String email,
    String phone,
    Role role,
    boolean enabled,
    boolean emailVerified,
    Instant createdAt,
    long orderCount,
    List<AddressResponse> addresses,
    List<OrderResponse> recentOrders
) {}
