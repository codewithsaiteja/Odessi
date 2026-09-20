package com.odessi.api.service;

import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.CreateOrderRequest;
import com.odessi.api.dto.response.CheckoutResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.mapper.OrderMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrderCheckoutFacade unit tests")
class OrderCheckoutFacadeTest {

    @Mock private OrderService orderService;
    @Mock private RazorpayPaymentService razorpayPaymentService;
    @Mock private AppProperties appProperties;
    @Mock private OrderMapper orderMapper;

    private OrderCheckoutFacade facade;
    private Order order;

    @BeforeEach
    void setUp() {
        AppProperties.Razorpay rzpProps = new AppProperties.Razorpay();
        rzpProps.setKeyId("rzp_test_key_123");
        rzpProps.setKeySecret("rzp_test_secret_123");

        lenient().when(appProperties.getRazorpay()).thenReturn(rzpProps);

        facade = new OrderCheckoutFacade(orderService, razorpayPaymentService, appProperties, orderMapper);

        User user = new User("Aarav", "Sharma", "aarav@example.com", "hash");
        user.setId(10L);

        order = new Order();
        order.setId(100L);
        order.setUser(user);
        order.setOrderNumber("ODR-20260913-00001");
        order.setTotalAmount(new BigDecimal("1499.00"));
        order.setCurrency("INR");
        order.setStatus(OrderStatus.PENDING_PAYMENT);
    }

    @Test
    @DisplayName("checkout — succeeds when order creation and Razorpay order creation succeed")
    void checkout_success() {
        CreateOrderRequest request = new CreateOrderRequest(1L, "Aarav Sharma", "9876543210", "Line 1", null, "Mumbai", "MH", "400001", "India");

        given(orderService.createPendingOrderAndReserveStock(10L, request)).willReturn(order);
        given(razorpayPaymentService.createRazorpayOrder(order)).willReturn("order_rzp_12345");

        CheckoutResponse response = facade.checkout(10L, request);

        assertThat(response.razorpayOrderId()).isEqualTo("order_rzp_12345");
        assertThat(response.razorpayKeyId()).isEqualTo("rzp_test_key_123");
        assertThat(response.amount()).isEqualTo(new BigDecimal("1499.00"));

        verify(orderService).attachRazorpayOrderId(100L, "order_rzp_12345");
        verify(orderService, never()).handleOrderCreationFailure(any());
    }

    @Test
    @DisplayName("checkout — Razorpay API failure releases stock reservation & marks order PAYMENT_FAILED")
    void checkout_razorpayFailure_releasesStockAndFailsOrder() {
        CreateOrderRequest request = new CreateOrderRequest(1L, "Aarav Sharma", "9876543210", "Line 1", null, "Mumbai", "MH", "400001", "India");

        given(orderService.createPendingOrderAndReserveStock(10L, request)).willReturn(order);
        given(razorpayPaymentService.createRazorpayOrder(order)).willThrow(new RuntimeException("Razorpay gateway unreachable"));

        assertThatThrownBy(() -> facade.checkout(10L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Payment provider error");

        verify(orderService).handleOrderCreationFailure(100L);
        verify(orderService, never()).attachRazorpayOrderId(any(), any());
    }
}
