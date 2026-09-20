package com.odessi.api.service;

import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.InventoryReservationRepository;
import com.odessi.api.repository.OrderRepository;
import com.odessi.api.repository.ProductVariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private InventoryReservationRepository reservationRepository;

    @Mock
    private OrderRepository orderRepository;

    private InventoryService inventoryService;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryService(variantRepository, reservationRepository, orderRepository);
    }

    @Test
    @DisplayName("reserveInventory — Decrements stock and creates reservation entity")
    void reserveInventory_success() {
        Order order = new Order();
        order.setId(1L);

        ProductVariant variant = new ProductVariant();
        variant.setId(10L);
        variant.setStockQuantity(5);
        variant.setActive(true);
        Product product = new Product();
        product.setName("Odessi Hoodie");
        variant.setProduct(product);

        Cart cart = new Cart(new User());
        CartItem cartItem = new CartItem(cart, variant, 2);

        when(variantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(variant));

        inventoryService.reserveInventory(order, List.of(cartItem), 15);

        assertThat(variant.getStockQuantity()).isEqualTo(3);
        verify(variantRepository).save(variant);

        ArgumentCaptor<InventoryReservation> captor = ArgumentCaptor.forClass(InventoryReservation.class);
        verify(reservationRepository).save(captor.capture());
        InventoryReservation savedRes = captor.getValue();
        assertThat(savedRes.getQuantity()).isEqualTo(2);
        assertThat(savedRes.getStatus()).isEqualTo(ReservationStatus.RESERVED);
    }

    @Test
    @DisplayName("reserveInventory — Throws exception when stock is insufficient")
    void reserveInventory_insufficientStock() {
        Order order = new Order();
        order.setId(1L);

        ProductVariant variant = new ProductVariant();
        variant.setId(10L);
        variant.setStockQuantity(1);
        variant.setActive(true);
        Product product = new Product();
        product.setName("Odessi Hoodie");
        variant.setProduct(product);

        Cart cart = new Cart(new User());
        CartItem cartItem = new CartItem(cart, variant, 5);

        when(variantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(variant));

        assertThatThrownBy(() -> inventoryService.reserveInventory(order, List.of(cartItem), 15))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    @DisplayName("releaseReservations — Restores stock and marks status RELEASED")
    void releaseReservations_success() {
        ProductVariant variant = new ProductVariant();
        variant.setId(10L);
        variant.setStockQuantity(3);

        Order order = new Order();
        order.setId(1L);

        InventoryReservation reservation = new InventoryReservation(order, variant, 2, Instant.now().plusSeconds(600));
        reservation.setId(100L);

        when(reservationRepository.findByOrderIdAndStatus(1L, ReservationStatus.RESERVED))
                .thenReturn(List.of(reservation));
        when(variantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(variant));

        inventoryService.releaseReservations(1L);

        assertThat(variant.getStockQuantity()).isEqualTo(5);
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.RELEASED);
        verify(variantRepository).save(variant);
        verify(reservationRepository).save(reservation);
    }

    @Test
    @DisplayName("cleanupExpiredReservations — Safely cleans up expired RESERVED stock")
    void cleanupExpiredReservations_success() {
        ProductVariant variant = new ProductVariant();
        variant.setId(10L);
        variant.setStockQuantity(0);

        Order order = new Order();
        order.setId(1L);
        order.setOrderNumber("ODR-TEST-00001");
        order.setStatus(OrderStatus.PENDING_PAYMENT);

        InventoryReservation reservation = new InventoryReservation(order, variant, 2, Instant.now().minusSeconds(60));
        reservation.setId(100L);

        when(reservationRepository.findExpiredReservationsForUpdate(eq(ReservationStatus.RESERVED), any(Instant.class)))
                .thenReturn(List.of(reservation));
        when(variantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(variant));

        inventoryService.cleanupExpiredReservations();

        assertThat(variant.getStockQuantity()).isEqualTo(2);
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.RELEASED);
        assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_FAILED);
        verify(orderRepository).save(order);
    }
}
