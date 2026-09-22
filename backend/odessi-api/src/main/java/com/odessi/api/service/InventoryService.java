package com.odessi.api.service;

import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.InventoryReservationRepository;
import com.odessi.api.repository.OrderRepository;
import com.odessi.api.repository.ProductVariantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class InventoryService {

    private static final Logger log = LoggerFactory.getLogger(InventoryService.class);

    private final ProductVariantRepository variantRepository;
    private final InventoryReservationRepository reservationRepository;
    private final OrderRepository orderRepository;

    public InventoryService(
            ProductVariantRepository variantRepository,
            InventoryReservationRepository reservationRepository,
            OrderRepository orderRepository) {
        this.variantRepository = variantRepository;
        this.reservationRepository = reservationRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * Atomically reserve inventory for order creation using pessimistic locking.
     */
    @Transactional
    public void reserveInventory(Order order, List<CartItem> cartItems, int expirationMinutes) {
        Instant expiresAt = Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES);

        for (CartItem cartItem : cartItems) {
            ProductVariant variant = variantRepository.findByIdForUpdate(cartItem.getProductVariant().getId())
                    .orElseThrow(() -> new BadRequestException("Product variant not found: " + cartItem.getProductVariant().getId()));

            if (!variant.isActive() || variant.getStockQuantity() < cartItem.getQuantity()) {
                throw new BadRequestException("Insufficient stock for item: " + variant.getProduct().getName() + " (" + variant.getSize() + "/" + variant.getColor() + ")");
            }

            variant.setStockQuantity(variant.getStockQuantity() - cartItem.getQuantity());
            variantRepository.save(variant);

            InventoryReservation reservation = new InventoryReservation(order, variant, cartItem.getQuantity(), expiresAt);
            reservationRepository.save(reservation);
        }
    }

    /**
     * Mark active reservations for an order as SOLD upon successful payment.
     */
    @Transactional
    public void confirmReservations(Long orderId) {
        List<InventoryReservation> reservations = reservationRepository.findByOrderIdAndStatus(orderId, ReservationStatus.RESERVED);
        for (InventoryReservation res : reservations) {
            res.setStatus(ReservationStatus.SOLD);
            reservationRepository.save(res);
        }
    }

    /**
     * Release active reservations for an order and restore variant stock. Idempotent.
     */
    @Transactional
    public void releaseReservations(Long orderId) {
        List<InventoryReservation> reservedList = reservationRepository.findByOrderIdAndStatus(orderId, ReservationStatus.RESERVED);
        List<InventoryReservation> soldList = reservationRepository.findByOrderIdAndStatus(orderId, ReservationStatus.SOLD);

        if (!reservedList.isEmpty() || !soldList.isEmpty()) {
            for (InventoryReservation res : reservedList) {
                ProductVariant variant = variantRepository.findByIdForUpdate(res.getVariant().getId()).orElse(res.getVariant());
                variant.setStockQuantity(variant.getStockQuantity() + res.getQuantity());
                variantRepository.save(variant);
                res.setStatus(ReservationStatus.RELEASED);
                reservationRepository.save(res);
            }
            for (InventoryReservation res : soldList) {
                ProductVariant variant = variantRepository.findByIdForUpdate(res.getVariant().getId()).orElse(res.getVariant());
                variant.setStockQuantity(variant.getStockQuantity() + res.getQuantity());
                variantRepository.save(variant);
                res.setStatus(ReservationStatus.RELEASED);
                reservationRepository.save(res);
            }
        } else {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null) {
                for (OrderItem item : order.getItems()) {
                    if (item.getProductVariant() != null) {
                        variantRepository.findByIdForUpdate(item.getProductVariant().getId()).ifPresent(variant -> {
                            variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
                            variantRepository.save(variant);
                        });
                    }
                }
            }
        }
    }

    /**
     * Scheduled cleanup job to safely release expired reservations.
     */
    @Scheduled(cron = "${app.checkout.scheduled-cleanup-cron:0 */5 * * * *}")
    @Transactional
    public void cleanupExpiredReservations() {
        Instant now = Instant.now();
        List<InventoryReservation> expired = reservationRepository.findExpiredReservationsForUpdate(ReservationStatus.RESERVED, now);

        if (expired.isEmpty()) {
            return;
        }

        log.info("Found {} expired inventory reservations to clean up", expired.size());

        for (InventoryReservation res : expired) {
            // Double check status hasn't changed concurrently
            if (res.getStatus() != ReservationStatus.RESERVED) {
                continue;
            }

            Order order = res.getOrder();
            if (order.getStatus() == OrderStatus.PENDING_PAYMENT) {
                order.setStatus(OrderStatus.PAYMENT_FAILED);
                orderRepository.save(order);
            }

            ProductVariant variant = variantRepository.findByIdForUpdate(res.getVariant().getId())
                    .orElse(res.getVariant());

            variant.setStockQuantity(variant.getStockQuantity() + res.getQuantity());
            variantRepository.save(variant);

            res.setStatus(ReservationStatus.RELEASED);
            reservationRepository.save(res);

            log.info("Released expired reservation ID {} for order {}", res.getId(), order.getOrderNumber());
        }
    }
}
