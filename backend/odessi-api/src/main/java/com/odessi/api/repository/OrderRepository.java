package com.odessi.api.repository;

import com.odessi.api.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    Page<Order> findByUserId(Long userId, Pageable pageable);

    Optional<Order> findByOrderNumber(String orderNumber);

    Optional<Order> findByOrderNumberAndUserId(String orderNumber, Long userId);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.items i WHERE o.orderNumber = :orderNumber")
    Optional<Order> findByOrderNumberWithItems(@Param("orderNumber") String orderNumber);

    /** Count orders today for order number generation. */
    @Query(value = "SELECT COUNT(*) FROM orders WHERE CAST(created_at AS date) = CURRENT_DATE", nativeQuery = true)
    long countOrdersToday();
}
