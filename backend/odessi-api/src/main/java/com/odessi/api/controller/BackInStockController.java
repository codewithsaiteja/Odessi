package com.odessi.api.controller;

import com.odessi.api.dto.request.BackInStockSubscribeRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.BackInStockResponse;
import com.odessi.api.entity.User;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.BackInStockService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/back-in-stock")
public class BackInStockController {

    private final BackInStockService backInStockService;
    private final AuthService authService;

    public BackInStockController(BackInStockService backInStockService, AuthService authService) {
        this.backInStockService = backInStockService;
        this.authService = authService;
    }

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<BackInStockResponse>> subscribe(
            @Valid @RequestBody BackInStockSubscribeRequest request) {
        User user = null;
        try {
            user = authService.getCurrentUser();
        } catch (Exception ignored) {
            // Unauthenticated guest user subscribing with email
        }
        BackInStockResponse response = backInStockService.subscribe(user, request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }

    @GetMapping("/admin/demand")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<BackInStockResponse>>> getDemandList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<BackInStockResponse> result = backInStockService.getDemandList(pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
