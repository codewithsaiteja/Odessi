package com.odessi.api.controller;

import com.odessi.api.dto.response.ShippingCalculationResponse;
import com.odessi.api.dto.response.ShippingMethodResponse;
import com.odessi.api.service.ShippingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/shipping-methods")
@Tag(name = "Shipping Methods", description = "Public shipping options and server calculation")
public class ShippingController {

    private final ShippingService shippingService;

    public ShippingController(ShippingService shippingService) {
        this.shippingService = shippingService;
    }

    @GetMapping
    @Operation(summary = "Get active shipping methods")
    public ResponseEntity<List<ShippingMethodResponse>> getActiveMethods() {
        return ResponseEntity.ok(shippingService.getAllActiveMethods());
    }

    @GetMapping("/calculate")
    @Operation(summary = "Calculate shipping charge server-side")
    public ResponseEntity<ShippingCalculationResponse> calculateShipping(
            @RequestParam(required = false) Long methodId,
            @RequestParam(required = false) String code,
            @RequestParam BigDecimal subtotal) {
        return ResponseEntity.ok(shippingService.calculateShipping(methodId, code, subtotal));
    }
}
