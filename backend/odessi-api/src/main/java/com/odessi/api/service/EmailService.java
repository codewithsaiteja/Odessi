package com.odessi.api.service;

import com.odessi.api.entity.Order;

public interface EmailService {
    void sendVerificationEmail(String to, String token);
    void sendPasswordResetEmail(String to, String token);
    void sendTestEmail(String to);
    void sendOrderConfirmationEmail(Order order);
}
