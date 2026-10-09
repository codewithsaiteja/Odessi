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
        logger.info("MOCK EMAIL SENT: Password Reset Link (Legacy)");
        logger.info("To: {}", to);
        logger.info("Reset Token: {}", token);
        logger.info("Link: http://localhost:3000/reset-password?token={}", token);
        logger.info("==================================================");
    }

    @Override
    public void sendPasswordResetOtpEmail(String to, String otp, int expiryMinutes) {
        logger.info("==================================================");
        logger.info("MOCK EMAIL SENT: Password Reset OTP");
        logger.info("To: {}", to);
        logger.info("OTP Code: {}", otp);
        logger.info("Expires in: {} minutes", expiryMinutes);
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

    @Override
    public void sendOrderStatusUpdateEmail(com.odessi.api.entity.Order order, com.odessi.api.entity.OrderStatus previousStatus, com.odessi.api.entity.OrderStatus newStatus) {
        String orderNum = order != null ? order.getOrderNumber() : "null";
        String recipient = order != null ? order.getCustomerEmail() : "null";
        String subject = ProductionEmailService.resolveStatusSubject(newStatus, orderNum);

        logger.info("==================================================");
        logger.info("MOCK EMAIL SENT: Order Status Update");
        logger.info("Order: {}", orderNum);
        logger.info("Recipient: {}", recipient);
        logger.info("Previous Status: {}", previousStatus);
        logger.info("New Status: {}", newStatus);
        logger.info("Subject: {}", subject);
        logger.info("==================================================");
    }

    @Override
    public void sendSellerApplicationApprovedEmail(String to, String sellerName, String sellerCode) {
        logger.info("==================================================");
        logger.info("MOCK EMAIL SENT: Seller Application Approved");
        logger.info("To: {}", to);
        logger.info("Seller Name: {}", sellerName);
        logger.info("Seller Code: {}", sellerCode);
        logger.info("Dashboard Link: http://localhost:3000/account?tab=seller");
        logger.info("==================================================");
    }

    @Override
    public void sendSellerApplicationRejectedEmail(String to, String sellerName, String reason) {
        logger.info("==================================================");
        logger.info("MOCK EMAIL SENT: Seller Application Decision");
        logger.info("To: {}", to);
        logger.info("Seller Name: {}", sellerName);
        logger.info("Reason: {}", reason);
        logger.info("==================================================");
    }
}
