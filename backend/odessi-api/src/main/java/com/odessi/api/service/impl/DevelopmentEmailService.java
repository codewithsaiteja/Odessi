package com.odessi.api.service.impl;

import com.odessi.api.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!prod")
public class DevelopmentEmailService implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(DevelopmentEmailService.class);

    @Override
    public void sendVerificationEmail(String to, String token) {
        logger.info("==================================================");
        logger.info("MOCK EMAIL SENT: Email Verification");
        logger.info("To: {}", to);
        logger.info("Verification Token: {}", token);
        logger.info("Link: http://localhost:3000/verify-email?token={}", token);
        logger.info("==================================================");
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        logger.info("==================================================");
        logger.info("MOCK EMAIL SENT: Password Reset");
        logger.info("To: {}", to);
        logger.info("Reset Token: {}", token);
        logger.info("Link: http://localhost:3000/reset-password?token={}", token);
        logger.info("==================================================");
    }

    @Override
    public void sendTestEmail(String to) {
        logger.info("==================================================");
        logger.info("MOCK EMAIL SENT: Test Email");
        logger.info("To: {}", to);
        logger.info("==================================================");
    }

    @Override
    public void sendOrderConfirmationEmail(com.odessi.api.entity.Order order) {
        logger.info("==================================================");
        logger.info("MOCK EMAIL SENT: Order Confirmation");
        logger.info("Order: {}", order != null ? order.getOrderNumber() : "null");
        logger.info("Recipient: {}", order != null ? order.getCustomerEmail() : "null");
        logger.info("Total: {}", order != null ? order.getTotalAmount() : "null");
        logger.info("==================================================");
    }
}
