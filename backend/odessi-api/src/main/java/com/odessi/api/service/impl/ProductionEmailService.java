package com.odessi.api.service.impl;

import com.odessi.api.config.AppProperties;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.service.EmailService;
import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.Year;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderItem;

/**
 * Production email service implementation.
 *
 * <p>Uses the official <b>Resend Java SDK</b> when {@code RESEND_API_KEY} is configured,
 * with graceful fallback to Jakarta Mail / JavaMailSender over SMTP when configured.
 *
 * <p>Security & Reliability:
 * <ul>
 *   <li>Reads {@code RESEND_API_KEY} from server-side environment variables via {@link AppProperties}.</li>
 *   <li>Never exposes API keys, tokens, or passwords in logs, client responses, or Git.</li>
 *   <li>Customer email addresses are masked in logs (e.g. {@code u***r@domain.com}).</li>
 *   <li>Verifies links against primary production frontend origin (https://www.odessitfi.me).</li>
 * </ul>
 */
@Service
@Profile("prod")
public class ProductionEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(ProductionEmailService.class);

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;
    private final Resend resendClient;

    @Autowired
    public ProductionEmailService(
            @Autowired(required = false) Resend resendClient,
            @Autowired(required = false) JavaMailSender mailSender,
            AppProperties appProperties) {
        this.mailSender = mailSender;
        this.appProperties = appProperties;

        AppProperties.Mail mailProps = appProperties.getMail();
        String from = mailProps.getFromEmail();

        if (resendClient != null) {
            this.resendClient = resendClient;
            log.info("ProductionEmailService initialized with Resend client. Sender: '{} <{}>', RESEND_API_KEY: [DETECTED]",
                    mailProps.getFromName(), from);
        } else if (mailProps.isResendConfigured()) {
            this.resendClient = new Resend(mailProps.getResendApiKey().trim());
            log.info("ProductionEmailService initialized with official Resend Java SDK. Sender: '{} <{}>', RESEND_API_KEY: [DETECTED]",
                    mailProps.getFromName(), from);
        } else {
            this.resendClient = null;
            if (mailProps.getHost() != null && !mailProps.getHost().isBlank()) {
                log.info("ProductionEmailService initialized with SMTP fallback. Sender: '{} <{}>', Host: {}",
                        mailProps.getFromName(), from, mailProps.getHost());
            } else {
                log.warn("Production email provider is not configured. Set RESEND_API_KEY in Render environment variables.");
            }
        }
    }

    /**
     * Checks whether an email provider (Resend or SMTP) is configured.
     */
    public boolean isMailConfigured() {
        return (resendClient != null) || appProperties.getMail().isConfigured();
    }

    /**
     * Returns true if the official Resend client is active.
     */
    public boolean isResendActive() {
        return resendClient != null;
    }

    @Override
    public void sendVerificationEmail(String to, String token) {
        String primaryFrontendUrl = resolvePrimaryFrontendUrl();
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        String verificationUrl = primaryFrontendUrl + "/verify-email?token=" + encodedToken;

        String htmlBody = buildVerificationEmailHtml(verificationUrl);
        sendHtmlEmail(to, "Verify Your Odessi Account", htmlBody);
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        String primaryFrontendUrl = resolvePrimaryFrontendUrl();
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        String resetUrl = primaryFrontendUrl + "/reset-password?token=" + encodedToken;

        String htmlBody = buildPasswordResetEmailHtml(resetUrl);
        sendHtmlEmail(to, "Reset Your Odessi Password", htmlBody);
    }

    @Override
    public void sendTestEmail(String to) {
        String recipient = (to != null && !to.isBlank()) ? to.trim() : appProperties.getMail().getFromEmail();
        String primaryFrontendUrl = resolvePrimaryFrontendUrl();
        String htmlBody = buildTestEmailHtml(primaryFrontendUrl);
        sendHtmlEmail(recipient, "Odessi.tfi — Production Email Integration Test", htmlBody);
    }

    @Override
    public void sendOrderConfirmationEmail(Order order) {
        if (order == null) {
            log.warn("[EMAIL] Order confirmation requested with null order");
            return;
        }

        String to = order.getCustomerEmail();
        if (to == null || to.isBlank()) {
            if (order.getUser() != null) {
                to = order.getUser().getEmail();
            }
        }
        if (to == null || to.isBlank()) {
            log.warn("[EMAIL] Order confirmation skipped: No customer email on order {}", order.getOrderNumber());
            return;
        }

        String orderNumber = order.getOrderNumber();
        String subject = "Order Confirmed — " + orderNumber + " | Odessi";
        String primaryFrontendUrl = resolvePrimaryFrontendUrl();
        String htmlBody = buildOrderConfirmationEmailHtml(order, primaryFrontendUrl);

        log.info("[EMAIL] Order confirmation requested");
        log.info("[EMAIL] Order: {}", orderNumber);
        log.info("[EMAIL] Recipient: {}", maskEmail(to));
        log.info("[EMAIL] Provider: RESEND");
        log.info("[EMAIL] Resend request started");

        AppProperties.Mail mailProps = appProperties.getMail();
        String fromEmail = mailProps.getFromEmail();
        String fromName = mailProps.getFromName();
        String fromFormatted = String.format("%s <%s>", fromName, fromEmail);

        if (resendClient != null) {
            try {
                CreateEmailOptions params = CreateEmailOptions.builder()
                        .from(fromFormatted)
                        .to(to.trim())
                        .subject(subject)
                        .html(htmlBody)
                        .build();

                CreateEmailResponse response = resendClient.emails().send(params);
                String messageId = (response != null && response.getId() != null) ? response.getId() : "ok";
                log.info("[EMAIL] Resend success: {}", messageId);
                return;
            } catch (Exception e) {
                log.error("[EMAIL] Resend failed");
                log.error("[EMAIL] Order: {}", orderNumber);
                log.error("[EMAIL] Error: {}", e.getMessage());

                // Fallback to verified sandbox sender if custom domain is not yet verified in Resend
                if (!fromEmail.equals("onboarding@resend.dev") && e.getMessage() != null &&
                        (e.getMessage().toLowerCase().contains("verify") || e.getMessage().toLowerCase().contains("domain") || e.getMessage().toLowerCase().contains("forbidden"))) {
                    try {
                        log.info("[EMAIL] Retrying with verified sandbox sender: onboarding@resend.dev");
                        CreateEmailOptions fallbackParams = CreateEmailOptions.builder()
                                .from("Odessi <onboarding@resend.dev>")
                                .to(to.trim())
                                .subject(subject)
                                .html(htmlBody)
                                .build();
                        CreateEmailResponse fallbackResp = resendClient.emails().send(fallbackParams);
                        String fallbackId = (fallbackResp != null && fallbackResp.getId() != null) ? fallbackResp.getId() : "ok";
                        log.info("[EMAIL] Resend success: {}", fallbackId);
                        return;
                    } catch (Exception retryEx) {
                        log.error("[EMAIL] Sandbox retry also failed: {}", retryEx.getMessage());
                    }
                }
            }
        }

        // SMTP fallback if Resend client is absent or fails
        if (mailSender != null && mailProps.getHost() != null && !mailProps.getHost().isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
                helper.setFrom(new InternetAddress(fromEmail, fromName, StandardCharsets.UTF_8.name()));
                helper.setTo(to.trim());
                helper.setSubject(subject);
                helper.setText(htmlBody, true);
                mailSender.send(message);
                log.info("[EMAIL] Order confirmation delivered via SMTP relay. Order: {}, Recipient: {}", orderNumber, maskEmail(to));
            } catch (Exception smtpEx) {
                log.error("[EMAIL] SMTP fallback failed for order {}: {}", orderNumber, smtpEx.getMessage());
            }
        }
    }

    /**
     * Sends an HTML email via the configured provider (Resend primary, SMTP fallback).
     *
     * @param to Recipient email address
     * @param subject Subject line
     * @param htmlBody HTML email content
     */
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (to == null || to.isBlank()) {
            throw new BadRequestException("INVALID_EMAIL", "Recipient email address is required.");
        }

        AppProperties.Mail mailProps = appProperties.getMail();
        String fromEmail = mailProps.getFromEmail();
        String fromName = mailProps.getFromName();
        String fromFormatted = String.format("%s <%s>", fromName, fromEmail);

        // 1. Primary: Official Resend Java SDK
        if (resendClient != null) {
            try {
                CreateEmailOptions params = CreateEmailOptions.builder()
                        .from(fromFormatted)
                        .to(to.trim())
                        .subject(subject)
                        .html(htmlBody)
                        .build();

                CreateEmailResponse response = resendClient.emails().send(params);
                String emailId = (response != null && response.getId() != null) ? response.getId() : "ok";
                log.info("Production email delivered via Resend. Subject: '{}', Recipient: {}, Resend ID: {}",
                        subject, maskEmail(to), emailId);
                return;
            } catch (Exception e) {
                log.error("Failed to deliver email via Resend to recipient {}: {}", maskEmail(to), e.getMessage());
                throw new BusinessException("EMAIL_SEND_FAILED",
                        "Failed to deliver email via Resend. Please check your address or try again later.");
            }
        }

        // 2. Fallback: SMTP via JavaMailSender
        if (mailSender != null && mailProps.getHost() != null && !mailProps.getHost().isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());

                helper.setFrom(new InternetAddress(fromEmail, fromName, StandardCharsets.UTF_8.name()));
                helper.setTo(to.trim());
                helper.setSubject(subject);
                helper.setText(htmlBody, true);

                mailSender.send(message);
                log.info("Production email delivered to SMTP relay. Subject: '{}', Recipient: {}", subject, maskEmail(to));
                return;
            } catch (MessagingException | MailException | UnsupportedEncodingException e) {
                log.error("Failed to deliver email with subject '{}' to recipient {}: {}",
                        subject, maskEmail(to), e.getMessage());
                throw new BusinessException("EMAIL_SEND_FAILED",
                        "Failed to deliver email. Please check your address or try again later.");
            }
        }

        // 3. Not configured
        log.warn("Production email sending skipped: neither RESEND_API_KEY nor SMTP is configured. Recipient: {}", maskEmail(to));
        throw new BusinessException("EMAIL_SERVICE_UNAVAILABLE",
                "Email service is temporarily unavailable. Please try again later or contact support.");
    }

    /**
     * Resolves the primary customer-facing frontend origin for verification and reset links.
     * Ensures comma-separated origins are never placed into generated URLs.
     */
    public String resolvePrimaryFrontendUrl() {
        String configuredPrimary = appProperties.getMail().getPrimaryFrontendUrl();
        if (configuredPrimary != null && !configuredPrimary.isBlank()) {
            return cleanUrl(configuredPrimary);
        }

        String rawFrontendUrl = System.getenv("FRONTEND_URL");
        if (rawFrontendUrl == null || rawFrontendUrl.isBlank()) {
            rawFrontendUrl = appProperties.getCors().getAllowedOrigins();
        }

        if (rawFrontendUrl != null && !rawFrontendUrl.isBlank()) {
            String[] origins = rawFrontendUrl.split(",");
            for (String origin : origins) {
                String trimmed = origin.trim();
                if (trimmed.equalsIgnoreCase("https://www.odessitfi.me")) {
                    return trimmed;
                }
            }
            for (String origin : origins) {
                String trimmed = origin.trim();
                if (trimmed.equalsIgnoreCase("https://odessitfi.me")) {
                    return trimmed;
                }
            }
            for (String origin : origins) {
                String trimmed = origin.trim();
                if (!trimmed.isBlank() && !trimmed.contains("localhost") && !trimmed.contains("127.0.0.1")) {
                    return cleanUrl(trimmed);
                }
            }
            if (origins.length > 0 && !origins[0].trim().isBlank()) {
                return cleanUrl(origins[0]);
            }
        }

        return "https://www.odessitfi.me";
    }

    /**
     * Masks an email address for safe logging without leaking customer PII.
     * E.g. "alex@example.com" -> "a***x@example.com", "a@b.com" -> "***@b.com".
     */
    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "***";
        }
        String trimmed = email.trim();
        int atIndex = trimmed.indexOf('@');
        if (atIndex <= 1) {
            return "***" + (atIndex >= 0 ? trimmed.substring(atIndex) : "");
        }
        String user = trimmed.substring(0, atIndex);
        String domain = trimmed.substring(atIndex);
        if (user.length() <= 2) {
            return user.charAt(0) + "***" + domain;
        }
        return user.charAt(0) + "***" + user.charAt(user.length() - 1) + domain;
    }

    private String cleanUrl(String url) {
        String trimmed = url.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    private String buildVerificationEmailHtml(String verificationUrl) {
        int year = Year.now().getValue();
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verify Your Odessi Account</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #080808; background-color: #FAF9F6; margin: 0; padding: 24px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #EFECE6; }
                    .header { background: #080808; color: #FAF9F6; padding: 36px 30px; text-align: center; }
                    .content { padding: 40px 32px; }
                    .button { display: inline-block; background: #080808; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 6px; font-weight: 600; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0; }
                    .footer { background: #F7F5F0; padding: 24px 30px; text-align: center; font-size: 12px; color: #7A7A7A; border-top: 1px solid #EFECE6; }
                    p { margin: 0 0 16px; font-size: 15px; color: #333333; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0;font-size:24px;font-weight:300;letter-spacing:3px;">ODESSI.TFI</h1>
                        <p style="margin:8px 0 0;font-size:11px;opacity:0.8;letter-spacing:2px;text-transform:uppercase;">Wear Your Story</p>
                    </div>
                    <div class="content">
                        <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#080808;">Verify Your Account</h2>
                        <p>Welcome to Odessi.tfi! Please verify your email address to complete your account setup and explore our luxury collections.</p>
                        <p style="text-align:center;margin:32px 0;">
                            <a href="%s" class="button">VERIFY EMAIL ADDRESS</a>
                        </p>
                        <p style="font-size:13px;color:#7A7A7A;">If you did not create an account with Odessi, please disregard this email.</p>
                        <p style="font-size:12px;color:#999999;margin-bottom:0;">This verification link will expire in 24 hours for security.</p>
                    </div>
                    <div class="footer">
                        <p style="margin:0 0 4px;font-size:12px;color:#7A7A7A;">&copy; %d Odessi.tfi. All rights reserved.</p>
                        <p style="margin:0;font-size:11px;letter-spacing:1px;color:#999999;text-transform:uppercase;">Premium &bull; Custom &bull; Iconic</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(verificationUrl, year);
    }

    private String buildPasswordResetEmailHtml(String resetUrl) {
        int year = Year.now().getValue();
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Odessi Password</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #080808; background-color: #FAF9F6; margin: 0; padding: 24px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #EFECE6; }
                    .header { background: #080808; color: #FAF9F6; padding: 36px 30px; text-align: center; }
                    .content { padding: 40px 32px; }
                    .button { display: inline-block; background: #080808; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 6px; font-weight: 600; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0; }
                    .footer { background: #F7F5F0; padding: 24px 30px; text-align: center; font-size: 12px; color: #7A7A7A; border-top: 1px solid #EFECE6; }
                    p { margin: 0 0 16px; font-size: 15px; color: #333333; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0;font-size:24px;font-weight:300;letter-spacing:3px;">ODESSI.TFI</h1>
                        <p style="margin:8px 0 0;font-size:11px;opacity:0.8;letter-spacing:2px;text-transform:uppercase;">Wear Your Story</p>
                    </div>
                    <div class="content">
                        <h2 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#080808;">Reset Your Password</h2>
                        <p>We received a request to reset the password for your Odessi account. Click the button below to choose a new password.</p>
                        <p style="text-align:center;margin:32px 0;">
                            <a href="%s" class="button">RESET PASSWORD</a>
                        </p>
                        <p style="font-size:13px;color:#7A7A7A;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
                        <p style="font-size:12px;color:#999999;margin-bottom:0;">This reset link will expire in 1 hour for security.</p>
                    </div>
                    <div class="footer">
                        <p style="margin:0 0 4px;font-size:12px;color:#7A7A7A;">&copy; %d Odessi.tfi. All rights reserved.</p>
                        <p style="margin:0;font-size:11px;letter-spacing:1px;color:#999999;text-transform:uppercase;">Premium &bull; Custom &bull; Iconic</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetUrl, year);
    }

    private String buildTestEmailHtml(String frontendUrl) {
        int year = Year.now().getValue();
        String timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now());
        String provider = resendClient != null ? "Resend (Official Java SDK)" : "SMTP Relay";

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Odessi.tfi — Email Service Test</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #080808; background-color: #FAF9F6; margin: 0; padding: 24px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #EFECE6; }
                    .header { background: #080808; color: #FAF9F6; padding: 36px 30px; text-align: center; }
                    .content { padding: 40px 32px; }
                    .status-badge { display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px; }
                    .info-table { width: 100%%; border-collapse: collapse; margin: 24px 0; }
                    .info-table td { padding: 12px 14px; border-bottom: 1px solid #EFECE6; font-size: 14px; }
                    .info-table td.label { font-weight: 600; color: #555555; width: 35%%; }
                    .button { display: inline-block; background: #080808; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin: 20px 0; }
                    .footer { background: #F7F5F0; padding: 24px 30px; text-align: center; font-size: 12px; color: #7A7A7A; border-top: 1px solid #EFECE6; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0;font-size:24px;font-weight:300;letter-spacing:3px;">ODESSI.TFI</h1>
                        <p style="margin:8px 0 0;font-size:11px;opacity:0.8;letter-spacing:2px;text-transform:uppercase;">Wear Your Story</p>
                    </div>
                    <div class="content">
                        <span class="status-badge">&bull; Operational</span>
                        <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#080808;">Email Service Active</h2>
                        <p>This is a verification email confirming that your Odessi.tfi production email integration is working successfully.</p>
                        
                        <table class="info-table">
                            <tr>
                                <td class="label">Provider</td>
                                <td><strong>%s</strong></td>
                            </tr>
                            <tr>
                                <td class="label">Timestamp</td>
                                <td>%s</td>
                            </tr>
                            <tr>
                                <td class="label">Frontend Origin</td>
                                <td><a href="%s" style="color:#080808;">%s</a></td>
                            </tr>
                        </table>

                        <p style="text-align:center;margin:28px 0;">
                            <a href="%s" class="button">VISIT STOREFRONT</a>
                        </p>
                        <p style="font-size:12px;color:#999999;margin-bottom:0;">Automated message sent by Odessi.tfi API.</p>
                    </div>
                    <div class="footer">
                        <p style="margin:0 0 4px;font-size:12px;color:#7A7A7A;">&copy; %d Odessi.tfi. All rights reserved.</p>
                        <p style="margin:0;font-size:11px;letter-spacing:1px;color:#999999;text-transform:uppercase;">Premium &bull; Custom &bull; Iconic</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(provider, timestamp, frontendUrl, frontendUrl, frontendUrl, year);
    }

    private String buildOrderConfirmationEmailHtml(Order order, String frontendUrl) {
        int year = Year.now().getValue();
        String orderNumber = escapeHtml(order.getOrderNumber());
        String customerName = escapeHtml(order.getCustomerName() != null ? order.getCustomerName() : "Valued Customer");
        String paymentStatus = order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "CAPTURED";

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a").withZone(ZoneId.of("Asia/Kolkata"));
        String orderDate = dtf.format(order.getCreatedAt() != null ? order.getCreatedAt() : Instant.now());

        String addressHtml = formatAddressHtml(order.getShippingAddressSnapshot());

        StringBuilder itemsRows = new StringBuilder();
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem item : order.getItems()) {
                String itemName = escapeHtml(item.getProductNameSnapshot() != null ? item.getProductNameSnapshot() : "Odessi Garment");
                String sku = escapeHtml(item.getSkuSnapshot() != null ? item.getSkuSnapshot() : "—");

                String color = item.getColorSnapshot();
                String size = item.getSizeSnapshot();
                String variantDesc;
                if (color != null && !color.isBlank() && size != null && !size.isBlank()) {
                    variantDesc = escapeHtml(color + " / " + size);
                } else if (color != null && !color.isBlank()) {
                    variantDesc = escapeHtml(color);
                } else if (size != null && !size.isBlank()) {
                    variantDesc = escapeHtml(size);
                } else {
                    variantDesc = "Standard";
                }

                String unitPrice = item.getUnitPrice() != null ? "₹" + item.getUnitPrice().toPlainString() : "—";
                int qty = item.getQuantity();
                String totalPrice = item.getTotalPrice() != null ? "₹" + item.getTotalPrice().toPlainString() : "—";

                itemsRows.append("""
                    <tr>
                        <td style="padding:12px;border-bottom:1px solid #EFECE6;">
                            <strong style="color:#080808;font-size:14px;">%s</strong><br>
                            <span style="font-size:12px;color:#777777;">SKU: %s &bull; %s</span>
                        </td>
                        <td style="padding:12px;border-bottom:1px solid #EFECE6;text-align:center;font-size:14px;color:#080808;">%d</td>
                        <td style="padding:12px;border-bottom:1px solid #EFECE6;text-align:right;font-size:14px;color:#080808;">%s</td>
                        <td style="padding:12px;border-bottom:1px solid #EFECE6;text-align:right;font-size:14px;font-weight:600;color:#080808;">%s</td>
                    </tr>
                """.formatted(itemName, sku, variantDesc, qty, unitPrice, totalPrice));
            }
        } else {
            itemsRows.append("<tr><td colspan='4' style='padding:16px;text-align:center;color:#777777;'>Order items details recorded.</td></tr>");
        }

        String subtotal = order.getSubtotal() != null ? "₹" + order.getSubtotal().toPlainString() : "₹0";
        String shipping = (order.getShippingAmount() != null && order.getShippingAmount().compareTo(BigDecimal.ZERO) > 0)
                ? "₹" + order.getShippingAmount().toPlainString() : "FREE";
        String discount = (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0)
                ? "-₹" + order.getDiscountAmount().toPlainString() : "₹0";
        String total = order.getTotalAmount() != null ? "₹" + order.getTotalAmount().toPlainString() : "₹0";

        String cleanOrigin = cleanUrl(frontendUrl);
        String viewOrderUrl = cleanOrigin + "/account";

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Confirmed — %s</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #080808; background-color: #FAF9F6; margin: 0; padding: 24px; }
                    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #EFECE6; }
                    .header { background: #080808; color: #FAF9F6; padding: 36px 30px; text-align: center; }
                    .content { padding: 36px 32px; }
                    .badge { display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px; }
                    .card { background: #FAF9F6; border: 1px solid #EFECE6; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
                    .items-table { width: 100%%; border-collapse: collapse; margin: 24px 0; }
                    .items-table th { background: #FAF9F6; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555555; border-bottom: 2px solid #EFECE6; }
                    .totals-table { width: 100%%; border-collapse: collapse; margin-top: 16px; }
                    .totals-table td { padding: 6px 0; font-size: 14px; }
                    .button { display: inline-block; background: #080808; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0 12px; }
                    .footer { background: #F7F5F0; padding: 24px 30px; text-align: center; font-size: 12px; color: #7A7A7A; border-top: 1px solid #EFECE6; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0;font-size:26px;font-weight:300;letter-spacing:4px;">ODESSI.TFI</h1>
                        <p style="margin:8px 0 0;font-size:11px;opacity:0.8;letter-spacing:2px;text-transform:uppercase;">Wear Your Story</p>
                    </div>
                    <div class="content">
                        <span class="badge">&bull; Payment Confirmed</span>
                        <h2 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#080808;">Thank you for your order!</h2>
                        <p style="margin:0 0 20px;font-size:14px;color:#555555;">Hello %s, we've received your order and our team is preparing it with meticulous care.</p>
                        
                        <div class="card">
                            <table style="width:100%%;font-size:13px;">
                                <tr>
                                    <td style="color:#777777;padding:4px 0;">Order Number:</td>
                                    <td style="font-weight:600;color:#080808;text-align:right;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:4px 0;">Order Date:</td>
                                    <td style="color:#080808;text-align:right;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:4px 0;">Payment Status:</td>
                                    <td style="font-weight:600;color:#2E7D32;text-align:right;">%s</td>
                                </tr>
                            </table>
                        </div>

                        <h3 style="margin:28px 0 12px;font-size:15px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#080808;">Order Items</h3>
                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th style="text-align:left;">Item</th>
                                    <th style="text-align:center;">Qty</th>
                                    <th style="text-align:right;">Price</th>
                                    <th style="text-align:right;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                %s
                            </tbody>
                        </table>

                        <div style="border-top:2px solid #080808;padding-top:12px;margin-top:20px;">
                            <table class="totals-table">
                                <tr>
                                    <td style="color:#555555;">Subtotal</td>
                                    <td style="text-align:right;font-weight:500;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#555555;">Shipping</td>
                                    <td style="text-align:right;font-weight:500;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#555555;">Discount</td>
                                    <td style="text-align:right;color:#2E7D32;font-weight:500;">%s</td>
                                </tr>
                                <tr style="font-size:16px;border-top:1px solid #EFECE6;">
                                    <td style="padding-top:10px;font-weight:700;color:#080808;">Total Paid</td>
                                    <td style="padding-top:10px;text-align:right;font-weight:700;color:#080808;">%s</td>
                                </tr>
                            </table>
                        </div>

                        <div class="card" style="margin-top:28px;">
                            <h4 style="margin:0 0 10px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#555555;">Shipping Address</h4>
                            <div style="font-size:13px;line-height:1.6;color:#080808;">
                                %s
                            </div>
                        </div>

                        <div style="text-align:center;margin:32px 0 16px;">
                            <a href="%s" class="button">VIEW YOUR ORDER</a>
                            <p style="margin:12px 0 0;font-size:12px;color:#777777;">Questions? Contact customer care at <a href="mailto:support@odessitfi.me" style="color:#080808;font-weight:600;">support@odessitfi.me</a></p>
                        </div>
                    </div>
                    <div class="footer">
                        <p style="margin:0 0 4px;font-size:12px;color:#7A7A7A;">&copy; %d Odessi.tfi. All rights reserved.</p>
                        <p style="margin:0;font-size:11px;letter-spacing:1px;color:#999999;text-transform:uppercase;">Premium &bull; Custom &bull; Iconic</p>
                    </div>
                </div>
            </body>
            </html>
        """.formatted(
            orderNumber,
            customerName,
            orderNumber,
            orderDate,
            paymentStatus,
            itemsRows.toString(),
            subtotal,
            shipping,
            discount,
            total,
            addressHtml,
            viewOrderUrl,
            year
        );
    }

    private String formatAddressHtml(String snapshotJson) {
        if (snapshotJson == null || snapshotJson.isBlank()) {
            return "<p style='margin:0;color:#777777;'>Address details recorded in order.</p>";
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(snapshotJson);
            StringBuilder sb = new StringBuilder();
            if (node.hasNonNull("fullName")) sb.append("<strong>").append(escapeHtml(node.get("fullName").asText())).append("</strong><br>");
            if (node.hasNonNull("phone")) sb.append(escapeHtml(node.get("phone").asText())).append("<br>");
            if (node.hasNonNull("addressLine1")) sb.append(escapeHtml(node.get("addressLine1").asText())).append("<br>");
            if (node.hasNonNull("addressLine2") && !node.get("addressLine2").asText().isBlank()) {
                sb.append(escapeHtml(node.get("addressLine2").asText())).append("<br>");
            }
            String city = node.hasNonNull("city") ? node.get("city").asText() : "";
            String state = node.hasNonNull("state") ? node.get("state").asText() : "";
            String zip = node.hasNonNull("postalCode") ? node.get("postalCode").asText() : "";
            String cityState = java.util.stream.Stream.of(city, state).filter(s -> !s.isBlank()).collect(java.util.stream.Collectors.joining(", "));
            if (!cityState.isBlank() || !zip.isBlank()) {
                sb.append(escapeHtml(cityState)).append(" ").append(escapeHtml(zip)).append("<br>");
            }
            if (node.hasNonNull("country")) sb.append(escapeHtml(node.get("country").asText()));
            return sb.toString();
        } catch (Exception e) {
            return "<p style='margin:0;color:#777777;'>Address on file</p>";
        }
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
}