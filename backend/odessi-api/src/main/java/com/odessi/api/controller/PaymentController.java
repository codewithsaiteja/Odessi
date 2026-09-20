package com.odessi.api.controller;

import com.odessi.api.dto.request.VerifyPaymentRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.RazorpayPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payments", description = "Payment verification endpoints")
public class PaymentController {

    private final RazorpayPaymentService razorpayPaymentService;
    private final AuthService authService;

    public PaymentController(RazorpayPaymentService razorpayPaymentService, AuthService authService) {
        this.razorpayPaymentService = razorpayPaymentService;
        this.authService = authService;
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify Razorpay payment signature & confirm order")
    public ResponseEntity<ApiResponse<OrderResponse>> verifyPayment(@Valid @RequestBody VerifyPaymentRequest request) {
        Long userId = authService.getCurrentUser().getId();
        OrderResponse response = razorpayPaymentService.verifyPayment(userId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
