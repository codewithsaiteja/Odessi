package com.odessi.api.service;

import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.dto.response.PagedResponse;

public interface OrderService {

    PagedResponse<OrderResponse> findByUser(Long userId, int page, int size);

    OrderResponse findByOrderNumber(String orderNumber, Long userId);

    com.odessi.api.entity.Order createPendingOrderAndReserveStock(Long userId, com.odessi.api.dto.request.CreateOrderRequest request);

    void attachRazorpayOrderId(Long orderId, String razorpayOrderId);

    void handleOrderCreationFailure(Long orderId);
}
