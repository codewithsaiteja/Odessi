package com.odessi.api.service;

import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderStatus;

public interface EmailService {
    void sendVerificationEmail(String to, String token);
    void sendPasswordResetEmail(String to, String token);
    void sendPasswordResetOtpEmail(String to, String otp, int expiryMinutes);
    void sendTestEmail(String to);
    void sendOrderConfirmationEmail(Order order);
    void sendOrderStatusUpdateEmail(Order order, OrderStatus previousStatus, OrderStatus newStatus);
}
