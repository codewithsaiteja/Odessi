package com.odessi.api.repository;

import com.odessi.api.entity.OrderStatus;
import com.odessi.api.entity.OrderStatusEmailLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderStatusEmailLogRepository extends JpaRepository<OrderStatusEmailLog, Long> {
    boolean existsByOrderIdAndOrderStatus(Long orderId, OrderStatus orderStatus);
    Optional<OrderStatusEmailLog> findByOrderIdAndOrderStatus(Long orderId, OrderStatus orderStatus);
}
