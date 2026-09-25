package com.odessi.api.controller;

import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.service.DropService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/drops")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDropController {

    private final DropService dropService;

    public AdminDropController(DropService dropService) {
        this.dropService = dropService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> getDrops(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PagedResponse<ProductResponse> drops = dropService.getAdminDrops(page, size);
        return ResponseEntity.ok(ApiResponse.ok(drops));
    }

    @PutMapping("/{id}/configure")
    public ResponseEntity<ApiResponse<ProductResponse>> configureDrop(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        ProductResponse updated = dropService.configureDrop(id, body);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
