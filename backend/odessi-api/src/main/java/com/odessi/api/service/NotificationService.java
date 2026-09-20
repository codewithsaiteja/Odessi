package com.odessi.api.service;

import com.odessi.api.entity.ProductVariant;

public interface NotificationService {
    void dispatchBackInStockNotifications(ProductVariant variant);
}
