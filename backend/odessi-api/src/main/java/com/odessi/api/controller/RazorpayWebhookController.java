package com.odessi.api.controller;

import com.odessi.api.service.RazorpayPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/razorpay")
@Tag(name = "Webhooks", description = "Razorpay async webhook integration")
public class RazorpayWebhookController {

    private final RazorpayPaymentService razorpayPaymentService;

    public RazorpayWebhookController(RazorpayPaymentService razorpayPaymentService) {
        this.razorpayPaymentService = razorpayPaymentService;
    }

    @PostMapping
    @Operation(summary = "Razorpay Webhook Endpoint")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signatureHeader) {

        if (signatureHeader == null || signatureHeader.isBlank()) {
            return ResponseEntity.badRequest().body("Missing X-Razorpay-Signature header");
        }

        razorpayPaymentService.processWebhook(rawBody, signatureHeader);
        return ResponseEntity.ok("OK");
    }
}
