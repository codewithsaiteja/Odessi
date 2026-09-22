package com.odessi.api.controller;

import com.odessi.api.dto.admin.AdminDashboardStatsResponse;
import com.odessi.api.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@Tag(name = "Admin Dashboard", description = "Admin KPIs and metrics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private final AdminService adminService;

    public AdminDashboardController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * Returns dashboard KPI metrics, filtered by the requested time range.
     *
     * <p>Accepted range values (case-insensitive):
     * <ul>
     *   <li>{@code TODAY}   — current calendar day in IST (Asia/Kolkata)</li>
     *   <li>{@code 7_DAYS}  — last 7 days rolling window</li>
     *   <li>{@code 30_DAYS} — last 30 days rolling window</li>
     *   <li>{@code 90_DAYS} — last 90 days rolling window</li>
     *   <li>{@code ALL}     — all historical data (default)</li>
     * </ul>
     * Unknown values are silently treated as {@code ALL}.
     *
     * <p>Example: {@code GET /api/admin/dashboard/stats?range=30_DAYS}
     */
    @GetMapping("/stats")
    @Operation(summary = "Get Dashboard KPI Statistics",
               description = "Returns revenue, orders, customers, and inventory KPIs for the selected time range. " +
                             "Revenue counts only CAPTURED and PAID payments.")
    public ResponseEntity<AdminDashboardStatsResponse> getStats(
        @Parameter(description = "Time range: TODAY | 7_DAYS | 30_DAYS | 90_DAYS | ALL")
        @RequestParam(name = "range", defaultValue = "ALL") String range
    ) {
        return ResponseEntity.ok(adminService.getDashboardStats(range));
    }
}
