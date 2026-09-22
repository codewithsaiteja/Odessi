package com.odessi.api.dto.admin;

import java.math.BigDecimal;
import java.util.List;

/**
 * KPI response for the Odessi Admin Dashboard.
 *
 * <p>Date-range semantics (half-open interval, IST-aware):
 * <ul>
 *   <li>TODAY  — [startOfDayIST, startOfNextDayIST)</li>
 *   <li>7_DAYS — [now − 7 days, now)</li>
 *   <li>30_DAYS — [now − 30 days, now)</li>
 *   <li>90_DAYS — [now − 90 days, now)</li>
 *   <li>ALL    — no date filter applied</li>
 * </ul>
 *
 * <p>Revenue definition: sum of {@code totalAmount} for orders whose
 * {@code paymentStatus} is {@code CAPTURED} or {@code PAID} only.
 * Pending, failed, or refunded payments are excluded.
 *
 * <p>totalCustomers is always the all-time registered-customer count
 * regardless of selected range (label: "Registered customer accounts").
 */
public record AdminDashboardStatsResponse(
    long totalOrders,
    BigDecimal totalRevenue,
    long pendingPaymentCount,
    long confirmedCount,
    long totalCustomers,
    long totalProducts,
    long lowStockCount,
    long outOfStockCount,
    List<DashboardOrderSummary> recentOrders,
    List<LowStockVariantSummary> lowStockProducts,
    List<AdminUserSummary> recentCustomers
) {

    /** Embedded customer identity for the customer-list widget. */
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

    /**
     * Lightweight low-stock variant summary for the dashboard alert panel.
     * Avoids loading the full ProductResponse for each variant.
     */
    public record LowStockVariantSummary(
        Long variantId,
        String productName,
        String sku,
        String size,
        String color,
        int stockQuantity
    ) {}
}
