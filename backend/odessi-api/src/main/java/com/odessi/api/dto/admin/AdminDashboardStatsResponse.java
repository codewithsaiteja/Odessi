package com.odessi.api.dto.admin;

import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.dto.response.ProductResponse;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardStatsResponse(
    long totalOrders,
    BigDecimal totalRevenue,
    long pendingPaymentCount,
    long confirmedCount,
    long totalCustomers,
    long totalProducts,
    long lowStockCount,
    long outOfStockCount,
    List<OrderResponse> recentOrders,
    List<ProductResponse> lowStockProducts,
    List<AdminUserSummary> recentCustomers
) {
    public record AdminUserSummary(
        Long id,
        String firstName,
        String lastName,
        String email,
        boolean enabled,
        boolean emailVerified,
        long orderCount,
        String createdAt
    ) {}
}
