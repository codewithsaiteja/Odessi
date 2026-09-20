package com.odessi.api.controller;

import com.odessi.api.dto.request.CreateOrderRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.CheckoutResponse;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.OrderCheckoutFacade;
import com.odessi.api.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "Orders", description = "Order checkout & management endpoints")
public class OrderController {

    private final OrderService orderService;
    private final OrderCheckoutFacade orderCheckoutFacade;
    private final AuthService authService;

    public OrderController(
            OrderService orderService,
            OrderCheckoutFacade orderCheckoutFacade,
            AuthService authService) {
        this.orderService = orderService;
        this.orderCheckoutFacade = orderCheckoutFacade;
        this.authService = authService;
    }

    @PostMapping
    @Operation(summary = "Create order and initiate Razorpay checkout")
    public ResponseEntity<ApiResponse<CheckoutResponse>> checkout(@Valid @RequestBody CreateOrderRequest request) {
        Long userId = authService.getCurrentUser().getId();
        CheckoutResponse checkoutResponse = orderCheckoutFacade.checkout(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(checkoutResponse));
    }

    @GetMapping
    @Operation(summary = "List orders for current user")
    public ResponseEntity<PagedResponse<OrderResponse>> listOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(orderService.findByUser(userId, page, size));
    }

    @GetMapping("/{orderNumber}")
    @Operation(summary = "Get order by order number")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable String orderNumber) {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(ApiResponse.ok(orderService.findByOrderNumber(orderNumber, userId)));
    }
}
