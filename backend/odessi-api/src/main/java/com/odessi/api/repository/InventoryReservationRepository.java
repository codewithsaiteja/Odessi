package com.odessi.api.repository;

import com.odessi.api.entity.InventoryReservation;
import com.odessi.api.entity.ReservationStatus;
import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, Long> {

    List<InventoryReservation> findByOrderId(Long orderId);

    List<InventoryReservation> findByOrderIdAndStatus(Long orderId, ReservationStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM InventoryReservation r WHERE r.status = :status AND r.expiresAt < :now")
    List<InventoryReservation> findExpiredReservationsForUpdate(
        @Param("status") ReservationStatus status,
        @Param("now") Instant now
    );
}
