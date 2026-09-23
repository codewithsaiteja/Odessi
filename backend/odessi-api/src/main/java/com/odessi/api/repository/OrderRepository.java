package com.odessi.api.repository;

import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderStatus;
import com.odessi.api.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    Page<Order> findByUserId(Long userId, Pageable pageable);

    List<Order> findByUserIdAndStatusInOrderByCreatedAtDesc(Long userId, List<OrderStatus> statuses);

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items i WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumberWithItems(@Param("orderNumber") String orderNumber);

    /** Count orders today for order number generation. */
    @Query(value = "SELECT COUNT(*) FROM orders WHERE CAST(created_at AS date) = CURRENT_DATE", nativeQuery = true)
    long countOrdersToday();

    // ── Dashboard KPI queries ────────────────────────────────────────────────

    /**
     * Count orders created within a half-open time window [start, end).
     * Used for ranged Total Orders KPI.
     */
    long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant start, Instant end);

    /**
     * Sum revenue (CAPTURED or PAID) within a half-open time window.
     * Revenue is defined as orders with authoritative successful payment status.
     * COALESCE ensures 0 is returned when there are no matching rows.
     */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE o.paymentStatus IN :statuses " +
           "AND o.createdAt >= :start AND o.createdAt < :end")
    BigDecimal sumRevenueInWindow(
        @Param("statuses") List<PaymentStatus> statuses,
        @Param("start") Instant start,
        @Param("end") Instant end
    );

    /**
     * Sum all-time revenue for CAPTURED or PAID orders.
     */
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
           "WHERE o.paymentStatus IN :statuses")
    BigDecimal sumRevenueAllTime(@Param("statuses") List<PaymentStatus> statuses);

    /**
     * Count orders by order status within a time window.
     * Used for confirmed/pending sub-counts.
     */
    long countByStatusInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
        List<OrderStatus> statuses,
        Instant start,
        Instant end
    );

    /**
     * Count orders by order status (all-time).
     */
    long countByStatusIn(List<OrderStatus> statuses);

    /**
     * Fetch up to N most-recent orders in a time window with user eagerly loaded.
     * JOIN FETCH user prevents N+1 when mapping customerName/customerEmail.
     */
    @Query("SELECT o FROM Order o JOIN FETCH o.user u " +
           "WHERE o.createdAt >= :start AND o.createdAt < :end " +
           "ORDER BY o.createdAt DESC")
    List<Order> findRecentOrdersInWindow(
        @Param("start") Instant start,
        @Param("end") Instant end,
        Pageable pageable
    );

    /**
     * Fetch up to N most-recent orders (all-time) with user eagerly loaded.
     * Uses Pageable(0, N, DESC createdAt) for the limit.
     */
    @Query("SELECT o FROM Order o JOIN FETCH o.user u ORDER BY o.createdAt DESC")
    List<Order> findRecentOrdersAllTime(Pageable pageable);

    /**
     * Fast indexed check if any order items reference variants belonging to this product.
     */
    @Query("SELECT COUNT(i) > 0 FROM OrderItem i WHERE i.productVariant.product.id = :productId")
    boolean existsByProductIdInOrderItems(@Param("productId") Long productId);
}
