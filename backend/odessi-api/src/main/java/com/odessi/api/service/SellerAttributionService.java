package com.odessi.api.service;

import com.odessi.api.entity.Order;

public interface SellerAttributionService {

    void attributeOrder(Order order, String sellerCode);

    void qualifyOrder(Long orderId);

    void disqualifyOrder(Long orderId, String reason);
}
