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
import com.odessi.api.entity.OrderStatus;

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
    public void sendPasswordResetOtpEmail(String to, String otp, int expiryMinutes) {
        String htmlBody = buildPasswordResetOtpHtml(otp, expiryMinutes);
        sendHtmlEmail(to, "Your Odessi Verification Code: " + otp, htmlBody);
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
            String messageId = null;
            try {
                CreateEmailOptions params = CreateEmailOptions.builder()
                        .from(fromFormatted)
                        .to(to.trim())
                        .subject(subject)
                        .html(htmlBody)
                        .build();

                CreateEmailResponse response = resendClient.emails().send(params);
                messageId = (response != null && response.getId() != null) ? response.getId() : null;
                if (messageId != null) {
                    log.info("[EMAIL] Resend success: {}", messageId);
                }
            } catch (Exception e) {
                log.error("[EMAIL] Resend failed for order {} with sender '{}': {}", orderNumber, fromFormatted, e.getMessage());

                // Fallback to verified sandbox sender if custom domain is not yet verified in Resend
                if (!fromEmail.equals("onboarding@resend.dev") && e.getMessage() != null &&
                        (e.getMessage().toLowerCase().contains("verify") || e.getMessage().toLowerCase().contains("domain")
                                || e.getMessage().toLowerCase().contains("forbidden") || e.getMessage().toLowerCase().contains("not verified"))) {
                    try {
                        log.info("[EMAIL] Retrying with verified sandbox sender: Odessi <onboarding@resend.dev>");
                        CreateEmailOptions fallbackParams = CreateEmailOptions.builder()
                                .from("Odessi <onboarding@resend.dev>")
                                .to(to.trim())
                                .subject(subject)
                                .html(htmlBody)
                                .build();
                        CreateEmailResponse fallbackResp = resendClient.emails().send(fallbackParams);
                        messageId = (fallbackResp != null && fallbackResp.getId() != null) ? fallbackResp.getId() : null;
                        if (messageId != null) {
                            log.info("[EMAIL] Resend success: {}", messageId);
                        }
                    } catch (Exception retryEx) {
                        log.error("[EMAIL] Sandbox retry also failed for order {}: {}", orderNumber, retryEx.getMessage());
                    }
                }
            }

            if (messageId != null) {
                try {
                    com.resend.services.emails.model.Email emailRecord = resendClient.emails().get(messageId);
                    if (emailRecord != null && emailRecord.getLastEvent() != null) {
                        log.info("[EMAIL] Resend delivery status: id={}, last_event={}", messageId, emailRecord.getLastEvent());
                    }
                } catch (Exception statusEx) {
                    log.debug("[EMAIL] Resend delivery status check skipped/unavailable for id {}: {}", messageId, statusEx.getMessage());
                }
                return;
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

    @Override
    public void sendOrderStatusUpdateEmail(Order order, OrderStatus previousStatus, OrderStatus newStatus) {
        if (order == null) {
            log.warn("[EMAIL] Status update email requested with null order");
            return;
        }

        String to = order.getCustomerEmail();
        if (to == null || to.isBlank()) {
            if (order.getUser() != null) {
                to = order.getUser().getEmail();
            }
        }
        if (to == null || to.isBlank()) {
            log.warn("[EMAIL] Status update email skipped: No customer email on order {}", order.getOrderNumber());
            return;
        }

        String orderNumber = order.getOrderNumber();
        String subject = resolveStatusSubject(newStatus, orderNumber);
        String primaryFrontendUrl = resolvePrimaryFrontendUrl();
        String htmlBody = buildOrderStatusUpdateEmailHtml(order, previousStatus, newStatus, primaryFrontendUrl);

        log.info("[EMAIL] Status update email requested. Order: {}, Transition: {} -> {}, Recipient: {}",
                orderNumber, previousStatus, newStatus, maskEmail(to));

        AppProperties.Mail mailProps = appProperties.getMail();
        String fromEmail = mailProps.getFromEmail();
        String fromName = mailProps.getFromName();
        String fromFormatted = String.format("%s <%s>", fromName, fromEmail);

        if (resendClient != null) {
            String messageId = null;
            try {
                CreateEmailOptions params = CreateEmailOptions.builder()
                        .from(fromFormatted)
                        .to(to.trim())
                        .subject(subject)
                        .html(htmlBody)
                        .build();

                CreateEmailResponse response = resendClient.emails().send(params);
                messageId = (response != null && response.getId() != null) ? response.getId() : null;
                if (messageId != null) {
                    log.info("[EMAIL] Resend status update email success: id={}", messageId);
                }
            } catch (Exception e) {
                log.error("[EMAIL] Resend status update email failed for order {} with sender '{}': {}",
                        orderNumber, fromFormatted, e.getMessage());

                // Fallback to verified sandbox sender if custom domain is not yet verified in Resend
                if (!fromEmail.equals("onboarding@resend.dev") && e.getMessage() != null &&
                        (e.getMessage().toLowerCase().contains("verify") || e.getMessage().toLowerCase().contains("domain")
                                || e.getMessage().toLowerCase().contains("forbidden") || e.getMessage().toLowerCase().contains("not verified"))) {
                    try {
                        log.info("[EMAIL] Retrying status update email with verified sandbox sender: Odessi <onboarding@resend.dev>");
                        CreateEmailOptions fallbackParams = CreateEmailOptions.builder()
                                .from("Odessi <onboarding@resend.dev>")
                                .to(to.trim())
                                .subject(subject)
                                .html(htmlBody)
                                .build();
                        CreateEmailResponse fallbackResp = resendClient.emails().send(fallbackParams);
                        messageId = (fallbackResp != null && fallbackResp.getId() != null) ? fallbackResp.getId() : null;
                        if (messageId != null) {
                            log.info("[EMAIL] Resend status update email fallback success: id={}", messageId);
                        }
                    } catch (Exception retryEx) {
                        log.error("[EMAIL] Sandbox retry also failed for order {}: {}", orderNumber, retryEx.getMessage());
                    }
                }
            }

            if (messageId != null) {
                return;
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
                log.info("[EMAIL] Status update email delivered via SMTP relay. Order: {}, Status: {}, Recipient: {}",
                        orderNumber, newStatus, maskEmail(to));
            } catch (Exception smtpEx) {
                log.error("[EMAIL] SMTP fallback failed for order {} status {}: {}", orderNumber, newStatus, smtpEx.getMessage());
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

    private String buildPasswordResetOtpHtml(String otp, int expiryMinutes) {
        int year = Year.now().getValue();
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Your Odessi Verification Code</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #080808; background-color: #FAF9F6; margin: 0; padding: 24px; }
                    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #EFECE6; }
                    .header { background: #080808; color: #FAF9F6; padding: 36px 30px; text-align: center; }
                    .content { padding: 40px 32px; background: #ffffff; }
                    .otp-box { background: #0D0D0D; color: #FAF9F6; border: 1px solid #2B2A27; border-radius: 6px; padding: 28px 20px; text-align: center; margin: 28px 0; }
                    .footer { background: #F7F5F0; padding: 24px 30px; text-align: center; font-size: 12px; color: #7A7A7A; border-top: 1px solid #EFECE6; }
                    p { margin: 0 0 16px; font-size: 14px; color: #333333; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0;font-size:22px;font-weight:300;letter-spacing:4px;color:#FAF9F6;">ODESSI.TFI</h1>
                        <p style="margin:8px 0 0;font-size:10px;opacity:0.75;letter-spacing:2px;text-transform:uppercase;color:#C5A880;">Atelier &bull; Security</p>
                    </div>
                    <div class="content">
                        <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#080808;letter-spacing:-0.2px;">PASSWORD RECOVERY VERIFICATION</h2>
                        <p>We received a request to reset your Odessi account password. Use the single-use verification code below to authorize your password recovery.</p>
                        
                        <div class="otp-box">
                            <span style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#C5A880;display:block;margin-bottom:12px;font-weight:600;">One-Time Security Code</span>
                            <span style="font-size:38px;font-weight:700;letter-spacing:14px;font-family:'Courier New',Courier,monospace;color:#FFFFFF;display:inline-block;padding-left:14px;">%s</span>
                            <span style="font-size:11px;color:#8C827A;display:block;margin-top:12px;letter-spacing:0.5px;">Valid for %d minutes &bull; Single-use authorization</span>
                        </div>

                        <p style="font-size:13px;color:#7A7A7A;line-height:1.5;">If you did not initiate this request, no action is needed. Your account remains secure. Odessi will never ask for your code via phone, chat, or email.</p>
                        <p style="font-size:12px;color:#999999;margin-bottom:0;border-top:1px solid #F0EEE9;padding-top:16px;">This verification code was generated automatically for your account security.</p>
                    </div>
                    <div class="footer">
                        <p style="margin:0 0 4px;font-size:12px;color:#7A7A7A;">&copy; %d Odessi.tfi. All rights reserved.</p>
                        <p style="margin:0;font-size:10px;letter-spacing:1.5px;color:#999999;text-transform:uppercase;">Wear Your Story</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(otp, expiryMinutes, year);
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
        String customerName = escapeHtml(order.getCustomerName() != null && !order.getCustomerName().isBlank()
                ? order.getCustomerName() : "Valued Customer");
        String paymentStatus = order.getPaymentStatus() != null ? order.getPaymentStatus().name() : "PAID";

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a 'IST'").withZone(ZoneId.of("Asia/Kolkata"));
        String orderDate = dtf.format(order.getCreatedAt() != null ? order.getCreatedAt() : Instant.now());

        String addressHtml = formatAddressHtml(order);

        StringBuilder itemsRows = new StringBuilder();
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem item : order.getItems()) {
                String itemName = escapeHtml(item.getProductNameSnapshot() != null ? item.getProductNameSnapshot() : "Odessi Garment");
                String sku = escapeHtml(item.getSkuSnapshot() != null ? item.getSkuSnapshot() : "—");
                String color = escapeHtml(item.getColorSnapshot() != null && !item.getColorSnapshot().isBlank() ? item.getColorSnapshot() : "—");
                String size = escapeHtml(item.getSizeSnapshot() != null && !item.getSizeSnapshot().isBlank() ? item.getSizeSnapshot() : "—");

                int qty = item.getQuantity() > 0 ? item.getQuantity() : 1;
                String unitPrice = item.getUnitPrice() != null ? "₹" + item.getUnitPrice().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "—";
                BigDecimal itemTotal = item.getTotalPrice() != null ? item.getTotalPrice()
                        : (item.getUnitPrice() != null ? item.getUnitPrice().multiply(BigDecimal.valueOf(qty)) : BigDecimal.ZERO);
                String subtotal = "₹" + itemTotal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();

                itemsRows.append("""
                    <tr style="border-bottom:1px solid #EFECE6;">
                        <td style="padding:12px 8px;font-size:13px;font-weight:600;color:#080808;">%s</td>
                        <td style="padding:12px 8px;font-size:12px;font-family:monospace;color:#666666;">%s</td>
                        <td style="padding:12px 8px;font-size:12px;color:#555555;text-align:center;">%s</td>
                        <td style="padding:12px 8px;font-size:12px;color:#555555;text-align:center;">%s</td>
                        <td style="padding:12px 8px;font-size:13px;color:#080808;text-align:center;font-weight:600;">%d</td>
                        <td style="padding:12px 8px;font-size:13px;color:#080808;text-align:right;">%s</td>
                        <td style="padding:12px 8px;font-size:13px;font-weight:600;color:#080808;text-align:right;">%s</td>
                    </tr>
                """.formatted(itemName, sku, color, size, qty, unitPrice, subtotal));
            }
        } else {
            itemsRows.append("<tr><td colspan='7' style='padding:20px;text-align:center;color:#777777;font-size:13px;'>Order items recorded in system.</td></tr>");
        }

        BigDecimal subtotalVal = order.getSubtotal() != null ? order.getSubtotal() : (order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
        String subtotalStr = "₹" + subtotalVal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();

        BigDecimal shipVal = order.getShippingAmount() != null ? order.getShippingAmount() : BigDecimal.ZERO;
        String shippingStr = shipVal.compareTo(BigDecimal.ZERO) > 0 ? "₹" + shipVal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "FREE";

        BigDecimal discVal = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        String discountStr = discVal.compareTo(BigDecimal.ZERO) > 0 ? "-₹" + discVal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "₹0.00";

        BigDecimal taxVal = order.getTaxAmount() != null ? order.getTaxAmount() : BigDecimal.ZERO;
        String taxStr = taxVal.compareTo(BigDecimal.ZERO) > 0 ? "₹" + taxVal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "Included";

        BigDecimal totalVal = order.getTotalAmount() != null ? order.getTotalAmount() : subtotalVal;
        String totalStr = "₹" + totalVal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();

        String razorpayOrderId = escapeHtml(order.getRazorpayOrderId() != null && !order.getRazorpayOrderId().isBlank()
                ? order.getRazorpayOrderId() : "—");
        String razorpayPaymentId = escapeHtml(order.getRazorpayPaymentId() != null && !order.getRazorpayPaymentId().isBlank()
                ? order.getRazorpayPaymentId() : "—");

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
                    .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #EFECE6; }
                    .header { background: #080808; color: #FAF9F6; padding: 36px 30px; text-align: center; }
                    .content { padding: 36px 32px; }
                    .badge { display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
                    .card { background: #FAF9F6; border: 1px solid #EFECE6; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
                    .table-wrapper { width: 100%%; overflow-x: auto; margin: 20px 0; }
                    .items-table { width: 100%%; border-collapse: collapse; min-width: 480px; }
                    .items-table th { background: #FAF9F6; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555555; border-bottom: 2px solid #EFECE6; }
                    .totals-table { width: 100%%; border-collapse: collapse; margin-top: 14px; }
                    .totals-table td { padding: 6px 0; font-size: 14px; }
                    .button { display: inline-block; background: #080808; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0 12px; }
                    .footer { background: #F7F5F0; padding: 24px 30px; text-align: center; font-size: 12px; color: #7A7A7A; border-top: 1px solid #EFECE6; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0;font-size:26px;font-weight:300;letter-spacing:4px;color:#FAF9F6;">ODESSI.TFI</h1>
                        <p style="margin:8px 0 0;font-size:11px;opacity:0.8;letter-spacing:2px;text-transform:uppercase;color:#FAF9F6;">Wear Your Story.</p>
                    </div>
                    <div class="content">
                        <div style="text-align:center;">
                            <span class="badge">&bull; Payment Confirmed</span>
                            <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:1px;color:#080808;text-transform:uppercase;">ORDER CONFIRMED</h2>
                            <p style="margin:0 0 20px;font-size:14px;color:#555555;">Thank you for your order, %s. We are preparing your garment with the highest craftsmanship.</p>
                        </div>
                        
                        <!-- Order Metadata -->
                        <div class="card">
                            <table style="width:100%%;font-size:13px;border-collapse:collapse;">
                                <tr>
                                    <td style="color:#777777;padding:5px 0;">Order Number:</td>
                                    <td style="font-weight:700;color:#080808;text-align:right;font-family:monospace;font-size:13px;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:5px 0;">Customer Name:</td>
                                    <td style="font-weight:600;color:#080808;text-align:right;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:5px 0;">Order Date / Time:</td>
                                    <td style="color:#080808;text-align:right;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:5px 0;">Order Status:</td>
                                    <td style="font-weight:600;color:#2E7D32;text-align:right;">CONFIRMED</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Product Details Table -->
                        <h3 style="margin:28px 0 12px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#080808;">Product Details</h3>
                        <div class="table-wrapper">
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th style="text-align:left;">Product</th>
                                        <th style="text-align:left;">SKU</th>
                                        <th style="text-align:center;">Color</th>
                                        <th style="text-align:center;">Size</th>
                                        <th style="text-align:center;">Qty</th>
                                        <th style="text-align:right;">Unit Price</th>
                                        <th style="text-align:right;">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    %s
                                </tbody>
                            </table>
                        </div>

                        <!-- Totals Breakdown -->
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
                                <tr>
                                    <td style="color:#555555;">Estimated Taxes (GST)</td>
                                    <td style="text-align:right;font-weight:500;color:#555555;">%s</td>
                                </tr>
                                <tr style="font-size:16px;border-top:1px solid #EFECE6;">
                                    <td style="padding-top:10px;font-weight:700;color:#080808;">Total Paid</td>
                                    <td style="padding-top:10px;text-align:right;font-weight:700;color:#080808;">%s</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Payment Details Card -->
                        <div class="card" style="margin-top:24px;">
                            <h4 style="margin:0 0 10px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#555555;">Payment Details</h4>
                            <table style="width:100%%;font-size:13px;border-collapse:collapse;">
                                <tr>
                                    <td style="color:#777777;padding:4px 0;width:40%%;">Payment Method:</td>
                                    <td style="font-weight:600;color:#080808;text-align:right;">Razorpay</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:4px 0;">Payment Status:</td>
                                    <td style="font-weight:600;color:#2E7D32;text-align:right;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:4px 0;">Razorpay Order ID:</td>
                                    <td style="font-family:monospace;font-size:12px;color:#080808;text-align:right;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:4px 0;">Razorpay Payment ID:</td>
                                    <td style="font-family:monospace;font-size:12px;color:#080808;text-align:right;">%s</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Shipping Address Card -->
                        <div class="card" style="margin-top:20px;">
                            <h4 style="margin:0 0 10px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#555555;">Shipping Address</h4>
                            <div style="font-size:13px;line-height:1.6;color:#080808;">
                                %s
                            </div>
                        </div>

                        <div style="text-align:center;margin:32px 0 16px;">
                            <a href="%s" class="button">VIEW YOUR ORDER</a>
                            <p style="margin:12px 0 0;font-size:12px;color:#777777;">Questions about your order? Contact customer care at <a href="mailto:support@odessitfi.me" style="color:#080808;font-weight:600;">support@odessitfi.me</a></p>
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
            customerName,
            orderDate,
            itemsRows.toString(),
            subtotalStr,
            shippingStr,
            discountStr,
            taxStr,
            totalStr,
            paymentStatus,
            razorpayOrderId,
            razorpayPaymentId,
            addressHtml,
            viewOrderUrl,
            year
        );
    }

    public static String resolveStatusSubject(OrderStatus status, String orderNumber) {
        String title;
        if (status == null) {
            title = "Order Update";
        } else {
            switch (status) {
                case PROCESSING -> title = "Order Processing";
                case SHIPPED -> title = "Order Shipped";
                case OUT_FOR_DELIVERY -> title = "Order Out for Delivery";
                case DELIVERED -> title = "Order Delivered";
                case CANCELLED -> title = "Order Cancelled";
                case CONFIRMED -> title = "Order Confirmed";
                case PAYMENT_FAILED -> title = "Payment Failed";
                default -> title = "Order Update";
            }
        }
        return title + " — " + orderNumber + " | Odessi";
    }

    private String buildOrderStatusUpdateEmailHtml(Order order, OrderStatus previousStatus, OrderStatus newStatus, String frontendUrl) {
        int year = Year.now().getValue();
        String orderNumber = escapeHtml(order.getOrderNumber());
        String customerName = escapeHtml(order.getCustomerName() != null && !order.getCustomerName().isBlank()
                ? order.getCustomerName() : "Valued Customer");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a 'IST'").withZone(ZoneId.of("Asia/Kolkata"));
        String updateDate = dtf.format(order.getUpdatedAt() != null ? order.getUpdatedAt() : Instant.now());

        String addressHtml = formatAddressHtml(order);

        // Status badge, headline, and message configuration
        String badgeText;
        String badgeBg;
        String badgeColor;
        String headlineText;
        String messageText;

        if (newStatus == OrderStatus.PROCESSING) {
            badgeText = "&bull; Order Processing";
            badgeBg = "#FEF3C7";
            badgeColor = "#92400E";
            headlineText = "ORDER IS PROCESSING";
            messageText = "Your order has been confirmed and our atelier is now preparing your garments with the highest craftsmanship.";
        } else if (newStatus == OrderStatus.SHIPPED) {
            badgeText = "&bull; Dispatched & Shipped";
            badgeBg = "#EFF6FF";
            badgeColor = "#1E40AF";
            headlineText = "ORDER HAS SHIPPED";
            messageText = "Your bespoke Odessi package has been carefully packed and handed to our premium logistics courier. It is on its journey to you.";
        } else if (newStatus == OrderStatus.OUT_FOR_DELIVERY) {
            badgeText = "&bull; Out for Delivery";
            badgeBg = "#F3E8FF";
            badgeColor = "#6B21A8";
            headlineText = "OUT FOR DELIVERY";
            messageText = "Your package is out for delivery with our delivery courier today. Please ensure someone is available at your shipping address to receive it.";
        } else if (newStatus == OrderStatus.DELIVERED) {
            badgeText = "&bull; Delivered";
            badgeBg = "#E8F5E9";
            badgeColor = "#2E7D32";
            headlineText = "ORDER DELIVERED";
            messageText = "Your order has been successfully delivered. We hope you cherish your new Odessi garments. Wear your story with pride.";
        } else if (newStatus == OrderStatus.CANCELLED) {
            badgeText = "&bull; Order Cancelled";
            badgeBg = "#FEE2E2";
            badgeColor = "#991B1B";
            headlineText = "ORDER CANCELLED";
            messageText = "Your order has been cancelled. If any payment was captured, your refund will be processed back to your original payment method within standard banking timelines.";
        } else if (newStatus == OrderStatus.CONFIRMED) {
            badgeText = "&bull; Order Confirmed";
            badgeBg = "#E8F5E9";
            badgeColor = "#2E7D32";
            headlineText = "ORDER CONFIRMED";
            messageText = "Your order has been confirmed. Thank you for choosing Odessi.tfi.";
        } else {
            badgeText = "&bull; " + (newStatus != null ? newStatus.name() : "UPDATED");
            badgeBg = "#F3F4F6";
            badgeColor = "#374151";
            headlineText = "ORDER UPDATE: " + (newStatus != null ? newStatus.name() : "UPDATED");
            messageText = "The status of your order has been updated to " + (newStatus != null ? newStatus.name() : "UPDATED") + ".";
        }

        StringBuilder itemsRows = new StringBuilder();
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem item : order.getItems()) {
                String itemName = escapeHtml(item.getProductNameSnapshot() != null ? item.getProductNameSnapshot() : "Odessi Garment");
                String sku = escapeHtml(item.getSkuSnapshot() != null ? item.getSkuSnapshot() : "—");
                String color = escapeHtml(item.getColorSnapshot() != null && !item.getColorSnapshot().isBlank() ? item.getColorSnapshot() : "—");
                String size = escapeHtml(item.getSizeSnapshot() != null && !item.getSizeSnapshot().isBlank() ? item.getSizeSnapshot() : "—");

                int qty = item.getQuantity() > 0 ? item.getQuantity() : 1;
                String unitPrice = item.getUnitPrice() != null ? "₹" + item.getUnitPrice().setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "—";
                BigDecimal itemTotal = item.getTotalPrice() != null ? item.getTotalPrice()
                        : (item.getUnitPrice() != null ? item.getUnitPrice().multiply(BigDecimal.valueOf(qty)) : BigDecimal.ZERO);
                String subtotal = "₹" + itemTotal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();

                itemsRows.append("""
                    <tr style="border-bottom:1px solid #EFECE6;">
                        <td style="padding:12px 8px;font-size:13px;font-weight:600;color:#080808;">%s</td>
                        <td style="padding:12px 8px;font-size:12px;font-family:monospace;color:#666666;">%s</td>
                        <td style="padding:12px 8px;font-size:12px;color:#555555;text-align:center;">%s</td>
                        <td style="padding:12px 8px;font-size:12px;color:#555555;text-align:center;">%s</td>
                        <td style="padding:12px 8px;font-size:13px;color:#080808;text-align:center;font-weight:600;">%d</td>
                        <td style="padding:12px 8px;font-size:13px;color:#080808;text-align:right;">%s</td>
                        <td style="padding:12px 8px;font-size:13px;font-weight:600;color:#080808;text-align:right;">%s</td>
                    </tr>
                """.formatted(itemName, sku, color, size, qty, unitPrice, subtotal));
            }
        } else {
            itemsRows.append("<tr><td colspan='7' style='padding:20px;text-align:center;color:#777777;font-size:13px;'>Order items recorded in system.</td></tr>");
        }

        BigDecimal subtotalVal = order.getSubtotal() != null ? order.getSubtotal() : (order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO);
        String subtotalStr = "₹" + subtotalVal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();

        BigDecimal shipVal = order.getShippingAmount() != null ? order.getShippingAmount() : BigDecimal.ZERO;
        String shippingStr = shipVal.compareTo(BigDecimal.ZERO) > 0 ? "₹" + shipVal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "FREE";

        BigDecimal discVal = order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO;
        String discountStr = discVal.compareTo(BigDecimal.ZERO) > 0 ? "-₹" + discVal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "₹0.00";

        BigDecimal taxVal = order.getTaxAmount() != null ? order.getTaxAmount() : BigDecimal.ZERO;
        String taxStr = taxVal.compareTo(BigDecimal.ZERO) > 0 ? "₹" + taxVal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString() : "Included";

        BigDecimal totalVal = order.getTotalAmount() != null ? order.getTotalAmount() : subtotalVal;
        String totalStr = "₹" + totalVal.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();

        String shippingMethodCode = escapeHtml(order.getShippingMethodCode() != null && !order.getShippingMethodCode().isBlank()
                ? order.getShippingMethodCode() : "STANDARD");

        String cleanOrigin = cleanUrl(frontendUrl);
        String viewOrderUrl = cleanOrigin + "/account";

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s — %s</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #080808; background-color: #FAF9F6; margin: 0; padding: 24px; }
                    .container { max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #EFECE6; }
                    .header { background: #080808; color: #FAF9F6; padding: 36px 30px; text-align: center; }
                    .content { padding: 36px 32px; }
                    .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
                    .card { background: #FAF9F6; border: 1px solid #EFECE6; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
                    .table-wrapper { width: 100%%; overflow-x: auto; margin: 20px 0; }
                    .items-table { width: 100%%; border-collapse: collapse; min-width: 480px; }
                    .items-table th { background: #FAF9F6; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555555; border-bottom: 2px solid #EFECE6; }
                    .totals-table { width: 100%%; border-collapse: collapse; margin-top: 14px; }
                    .totals-table td { padding: 6px 0; font-size: 14px; }
                    .button { display: inline-block; background: #080808; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0 12px; }
                    .footer { background: #F7F5F0; padding: 24px 30px; text-align: center; font-size: 12px; color: #7A7A7A; border-top: 1px solid #EFECE6; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 style="margin:0;font-size:26px;font-weight:300;letter-spacing:4px;color:#FAF9F6;">ODESSI.TFI</h1>
                        <p style="margin:8px 0 0;font-size:11px;opacity:0.8;letter-spacing:2px;text-transform:uppercase;color:#FAF9F6;">Wear Your Story.</p>
                    </div>
                    <div class="content">
                        <div style="text-align:center;">
                            <span class="badge" style="background:%s;color:%s;">%s</span>
                            <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:1px;color:#080808;text-transform:uppercase;">%s</h2>
                            <p style="margin:0 0 20px;font-size:14px;color:#555555;">%s</p>
                        </div>
                        
                        <!-- Order Status Card -->
                        <div class="card">
                            <table style="width:100%%;font-size:13px;border-collapse:collapse;">
                                <tr>
                                    <td style="color:#777777;padding:5px 0;">Order Number:</td>
                                    <td style="font-weight:700;color:#080808;text-align:right;font-family:monospace;font-size:13px;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:5px 0;">Customer Name:</td>
                                    <td style="font-weight:600;color:#080808;text-align:right;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:5px 0;">Status Updated:</td>
                                    <td style="color:#080808;text-align:right;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:5px 0;">Current Status:</td>
                                    <td style="font-weight:700;color:%s;text-align:right;text-transform:uppercase;">%s</td>
                                </tr>
                                <tr>
                                    <td style="color:#777777;padding:5px 0;">Shipping Method:</td>
                                    <td style="font-weight:600;color:#080808;text-align:right;text-transform:uppercase;">%s</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Product Details Table -->
                        <h3 style="margin:28px 0 12px;font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#080808;">Items in Order</h3>
                        <div class="table-wrapper">
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th style="text-align:left;">Product</th>
                                        <th style="text-align:left;">SKU</th>
                                        <th style="text-align:center;">Color</th>
                                        <th style="text-align:center;">Size</th>
                                        <th style="text-align:center;">Qty</th>
                                        <th style="text-align:right;">Unit Price</th>
                                        <th style="text-align:right;">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    %s
                                </tbody>
                            </table>
                        </div>

                        <!-- Totals Breakdown -->
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
                                <tr>
                                    <td style="color:#555555;">Estimated Taxes (GST)</td>
                                    <td style="text-align:right;font-weight:500;color:#555555;">%s</td>
                                </tr>
                                <tr style="font-size:16px;border-top:1px solid #EFECE6;">
                                    <td style="padding-top:10px;font-weight:700;color:#080808;">Order Total</td>
                                    <td style="padding-top:10px;text-align:right;font-weight:700;color:#080808;">%s</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Shipping Address Card -->
                        <div class="card" style="margin-top:20px;">
                            <h4 style="margin:0 0 10px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#555555;">Delivery Address</h4>
                            <div style="font-size:13px;line-height:1.6;color:#080808;">
                                %s
                            </div>
                        </div>

                        <div style="text-align:center;margin:32px 0 16px;">
                            <a href="%s" class="button">VIEW YOUR ORDER</a>
                            <p style="margin:12px 0 0;font-size:12px;color:#777777;">Questions about your order? Contact customer care at <a href="mailto:support@odessitfi.me" style="color:#080808;font-weight:600;">support@odessitfi.me</a></p>
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
            headlineText,
            orderNumber,
            badgeBg,
            badgeColor,
            badgeText,
            headlineText,
            messageText,
            orderNumber,
            customerName,
            updateDate,
            badgeColor,
            newStatus != null ? newStatus.name() : "UPDATED",
            shippingMethodCode,
            itemsRows.toString(),
            subtotalStr,
            shippingStr,
            discountStr,
            taxStr,
            totalStr,
            addressHtml,
            viewOrderUrl,
            year
        );
    }

    private String formatAddressHtml(Order order) {
        String snapshotJson = order.getShippingAddressSnapshot();
        String fallbackName = order.getCustomerName();
        if (snapshotJson == null || snapshotJson.isBlank()) {
            StringBuilder sb = new StringBuilder();
            if (fallbackName != null && !fallbackName.isBlank()) {
                sb.append("<strong style='color:#080808;'>").append(escapeHtml(fallbackName)).append("</strong><br>");
            }
            sb.append("<span style='color:#777777;'>Address details recorded in order.</span>");
            return sb.toString();
        }
        try {
            ObjectMapper mapper = new ObjectMapper()
                    .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            JsonNode node = mapper.readTree(snapshotJson);
            if (node == null || !node.isObject()) {
                return "<span style='color:#777777;'>Address recorded on file.</span>";
            }
            StringBuilder sb = new StringBuilder();
            String name = getFieldText(node, "fullName", "name", "customerName");
            if (name == null || name.isBlank()) {
                name = fallbackName;
            }
            if (name != null && !name.isBlank()) {
                sb.append("<strong style='color:#080808;'>").append(escapeHtml(name)).append("</strong><br>");
            }
            String phone = getFieldText(node, "phone", "phoneNumber");
            if (phone != null && !phone.isBlank()) {
                sb.append("<span style='color:#555555;'>Phone: ").append(escapeHtml(phone)).append("</span><br>");
            }
            String line1 = getFieldText(node, "addressLine1", "address_line_1", "line1", "address");
            if (line1 != null && !line1.isBlank()) {
                sb.append(escapeHtml(line1)).append("<br>");
            }
            String line2 = getFieldText(node, "addressLine2", "address_line_2", "line2");
            if (line2 != null && !line2.isBlank()) {
                sb.append(escapeHtml(line2)).append("<br>");
            }
            String city = getFieldText(node, "city");
            String state = getFieldText(node, "state");
            String zip = getFieldText(node, "postalCode", "postal_code", "pincode", "zipCode", "zip");
            String cityStateZip = java.util.stream.Stream.of(city, state, zip)
                    .filter(s -> s != null && !s.isBlank())
                    .collect(java.util.stream.Collectors.joining(", "));
            if (!cityStateZip.isBlank()) {
                sb.append(escapeHtml(cityStateZip)).append("<br>");
            }
            String country = getFieldText(node, "country");
            if (country == null || country.isBlank()) {
                country = "India";
            }
            sb.append("<span style='color:#555555;'>").append(escapeHtml(country)).append("</span>");
            return sb.toString();
        } catch (Exception e) {
            return "<span style='color:#777777;'>Address recorded on file</span>";
        }
    }

    private static String getFieldText(JsonNode root, String... fieldNames) {
        for (String fieldName : fieldNames) {
            if (root.hasNonNull(fieldName)) {
                String val = root.get(fieldName).asText();
                if (!val.isBlank()) {
                    return val.trim();
                }
            }
        }
        return null;
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }

    @Override
    public void sendSellerApplicationApprovedEmail(String to, String sellerName, String sellerCode) {
        if (to == null || to.isBlank()) return;
        String subject = "Welcome to ODESSI Trusted Sellers Program — Your Application is Approved!";
        String htmlBody = "<div style='font-family:sans-serif;max-width:600px;margin:0 auto;background:#101010;color:#F3F0E8;padding:32px;border-radius:8px;'>"
            + "<h1 style='color:#CBB57B;font-size:20px;margin-bottom:16px;'>ODISSI TRUSTED SELLERS PROGRAM</h1>"
            + "<p>Dear " + escapeHtml(sellerName) + ",</p>"
            + "<p>Congratulations! Your application to become an <strong>ODISSI Trusted Seller</strong> has been approved by our team.</p>"
            + "<div style='background:#1c1c1c;border:1px solid #333;padding:16px;margin:24px 0;border-radius:4px;'>"
            + "<p style='margin:0;color:#9C978E;font-size:12px;'>YOUR UNIQUE SELLER CODE:</p>"
            + "<h2 style='margin:8px 0;color:#CBB57B;letter-spacing:2px;font-family:monospace;'>" + escapeHtml(sellerCode) + "</h2>"
            + "<p style='margin:0;color:#9C978E;font-size:12px;'>Share your link or code with your audience to generate verified sales and unlock exclusive milestone gifts.</p>"
            + "</div>"
            + "<p><a href='https://www.odessitfi.me/account?tab=seller' style='display:inline-block;background:#F3F0E8;color:#080808;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:2px;'>OPEN SELLER DASHBOARD</a></p>"
            + "<p style='color:#777;font-size:11px;margin-top:32px;'>ODISSI.TFI · Luxury Architectural Streetwear</p>"
            + "</div>";

        sendHtmlEmail(to, subject, htmlBody);
    }

    @Override
    public void sendSellerApplicationRejectedEmail(String to, String sellerName, String reason) {
        if (to == null || to.isBlank()) return;
        String subject = "Update Regarding Your ODESSI Seller Application";
        String htmlBody = "<div style='font-family:sans-serif;max-width:600px;margin:0 auto;background:#101010;color:#F3F0E8;padding:32px;border-radius:8px;'>"
            + "<h1 style='color:#CBB57B;font-size:20px;margin-bottom:16px;'>ODISSI TRUSTED SELLERS PROGRAM</h1>"
            + "<p>Dear " + escapeHtml(sellerName) + ",</p>"
            + "<p>Thank you for your interest in the ODESSI Trusted Sellers Program. After reviewing your application, we regret to inform you that we are unable to approve your application at this time.</p>"
            + (reason != null && !reason.isBlank() ? "<p><strong>Reason:</strong> " + escapeHtml(reason) + "</p>" : "")
            + "<p>You are welcome to re-apply in the future. If you have questions, please reach out to our team at support@odessitfi.me.</p>"
            + "<p style='color:#777;font-size:11px;margin-top:32px;'>ODISSI.TFI · Luxury Architectural Streetwear</p>"
            + "</div>";

        sendHtmlEmail(to, subject, htmlBody);
    }
}