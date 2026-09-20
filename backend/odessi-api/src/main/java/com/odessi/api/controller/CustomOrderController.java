package com.odessi.api.controller;

import com.odessi.api.dto.request.CustomOrderRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.CustomOrderResponse;
import com.odessi.api.service.CustomOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/custom-orders")
public class CustomOrderController {

    private final CustomOrderService customOrderService;

    public CustomOrderController(CustomOrderService customOrderService) {
        this.customOrderService = customOrderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomOrderResponse>> submitInquiry(@Valid @RequestBody CustomOrderRequest request) {
        CustomOrderResponse response = customOrderService.submitInquiry(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }
}
