package com.odessi.api.controller;

import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.User;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.ProductMapper;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.service.AdminAuditService;
import com.odessi.api.service.AuthService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/drops")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDropController {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final AdminAuditService auditService;
    private final AuthService authService;

    public AdminDropController(ProductRepository productRepository, ProductMapper productMapper, AdminAuditService auditService, AuthService authService) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.auditService = auditService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getDrops(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ProductResponse> drops = productRepository.findAll(pageRequest)
            .map(productMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.ok(drops));
    }

    @PutMapping("/{id}/configure")
    public ResponseEntity<ApiResponse<ProductResponse>> configureDrop(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        User admin = authService.getCurrentUser();
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + id));

        Boolean isDrop = (Boolean) body.get("isDrop");
        String dropTitle = (String) body.get("dropTitle");
        String dropDescription = (String) body.get("dropDescription");
        String launchAtStr = (String) body.get("launchAt");

        if (isDrop != null) product.setDrop(isDrop);
        if (dropTitle != null) product.setDropTitle(dropTitle);
        if (dropDescription != null) product.setDropDescription(dropDescription);
        if (launchAtStr != null && !launchAtStr.isBlank()) {
            product.setLaunchAt(Instant.parse(launchAtStr));
        } else if (Boolean.FALSE.equals(isDrop)) {
            product.setLaunchAt(null);
        }

        Product updated = productRepository.save(product);

        auditService.logAction(admin, "DROP_CONFIGURED", "Product", id.toString(),
            "Configured drop settings for product " + updated.getName() + " (isDrop=" + updated.isDrop() + ")");

        return ResponseEntity.ok(ApiResponse.ok(productMapper.toResponse(updated)));
    }
}
