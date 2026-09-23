package com.odessi.api.controller;

import com.odessi.api.config.AppProperties;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.EmailService;
import com.odessi.api.service.impl.ProductionEmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Admin email management and testing controller.
 *
 * <p>Enables administrators to verify and trigger safe test emails using the configured
 * provider (official Resend Java SDK or SMTP) without modifying customer state.
 */
@RestController
@RequestMapping("/api/admin/email")
@Tag(name = "Admin Email", description = "Email service management and testing")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmailController {

    private final EmailService emailService;
    private final AppProperties appProperties;

    public AdminEmailController(EmailService emailService, AppProperties appProperties) {
        this.emailService = emailService;
        this.appProperties = appProperties;
    }

    public record SendTestEmailRequest(String to) {}

    @PostMapping("/test")
    @Operation(summary = "Send a safe test email via Resend")
    public ResponseEntity<Map<String, Object>> sendTestEmail(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody(required = false) SendTestEmailRequest request) {

        String recipient = null;
        if (request != null && request.to() != null && !request.to().isBlank()) {
            recipient = request.to().trim();
        } else if (userDetails != null && userDetails.getUsername() != null) {
            recipient = userDetails.getUsername();
        } else {
            recipient = appProperties.getMail().getFromEmail();
        }

        emailService.sendTestEmail(recipient);

        boolean isResend = (emailService instanceof ProductionEmailService prodService) && prodService.isResendActive();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test email sent successfully",
                "recipient", ProductionEmailService.maskEmail(recipient),
                "provider", isResend ? "Resend" : "Standard",
                "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/status")
    @Operation(summary = "Get current email service configuration status")
    public ResponseEntity<Map<String, Object>> getEmailStatus() {
        AppProperties.Mail mail = appProperties.getMail();
        boolean isResend = mail.isResendConfigured();
        boolean isConfigured = mail.isConfigured();

        return ResponseEntity.ok(Map.of(
                "configured", isConfigured,
                "provider", isResend ? "Resend" : (mail.getHost() != null ? "SMTP" : "None"),
                "resendConfigured", isResend,
                "fromEmail", mail.getFromEmail(),
                "fromName", mail.getFromName(),
                "primaryFrontendUrl", mail.getPrimaryFrontendUrl()
        ));
    }
}
