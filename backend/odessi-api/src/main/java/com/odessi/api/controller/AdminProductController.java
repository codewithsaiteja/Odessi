package com.odessi.api.controller;

import com.odessi.api.dto.admin.AdminProductRequest;
import com.odessi.api.dto.admin.AdminVariantRequest;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.entity.User;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/products")
@Tag(name = "Admin Products", description = "Product and Variant administration")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    public AdminProductController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    private User getAdminUser(CustomUserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findById(userDetails.getId()).orElse(null);
    }

    @GetMapping
    @Operation(summary = "List all products for admin")
    public ResponseEntity<Page<ProductResponse>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long collectionId,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(adminService.getProducts(search, categoryId, collectionId, active, status, pageRequest));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product details for admin")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getProductById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new product")
    public ResponseEntity<ProductResponse> createProduct(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AdminProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createProduct(getAdminUser(userDetails), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing product")
    public ResponseEntity<ProductResponse> updateProduct(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody AdminProductRequest request) {
        return ResponseEntity.ok(adminService.updateProduct(getAdminUser(userDetails), id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Toggle product active status (archive/unarchive)")
    public ResponseEntity<ProductResponse> toggleActive(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleProductActive(getAdminUser(userDetails), id));
    }

    @PatchMapping("/{id}/featured")
    @Operation(summary = "Toggle product featured status")
    public ResponseEntity<ProductResponse> toggleFeatured(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleProductFeatured(getAdminUser(userDetails), id));
    }

    @PostMapping("/{id}/duplicate")
    @Operation(summary = "Duplicate product metadata and variant matrix")
    public ResponseEntity<ProductResponse> duplicateProduct(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.duplicateProduct(getAdminUser(userDetails), id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Safe delete or archive product")
    public ResponseEntity<java.util.Map<String, Object>> deleteProduct(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        com.odessi.api.service.AdminService.DeleteProductResult result = adminService.deleteProduct(getAdminUser(userDetails), id);
        return ResponseEntity.ok(java.util.Map.of(
            "message", result.message(),
            "archived", result.archived()
        ));
    }

    @PostMapping("/bulk")
    @Operation(summary = "Bulk actions for catalog products")
    public ResponseEntity<java.util.List<ProductResponse>> bulkAction(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody com.odessi.api.dto.admin.AdminBulkProductRequest request) {
        return ResponseEntity.ok(adminService.bulkProductAction(getAdminUser(userDetails), request));
    }

    @GetMapping("/{id}/activity")
    @Operation(summary = "Get product activity audit log history")
    public ResponseEntity<java.util.List<com.odessi.api.dto.admin.AdminAuditLogResponse>> getProductActivity(
            @PathVariable Long id) {
        return ResponseEntity.ok(adminService.getProductActivity(id));
    }

    @PostMapping("/{productId}/variants")
    @Operation(summary = "Add a new variant to product")
    public ResponseEntity<ProductResponse> addVariant(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId,
            @Valid @RequestBody AdminVariantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.addVariant(getAdminUser(userDetails), productId, request));
    }

    @PutMapping("/{productId}/variants/{variantId}")
    @Operation(summary = "Update an existing variant")
    public ResponseEntity<ProductResponse> updateVariant(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId,
            @PathVariable Long variantId,
            @Valid @RequestBody AdminVariantRequest request) {
        return ResponseEntity.ok(adminService.updateVariant(getAdminUser(userDetails), productId, variantId, request));
    }

    @DeleteMapping("/{productId}/variants/{variantId}")
    @Operation(summary = "Delete an existing variant")
    public ResponseEntity<ProductResponse> deleteVariant(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId,
            @PathVariable Long variantId) {
        return ResponseEntity.ok(adminService.deleteVariant(getAdminUser(userDetails), productId, variantId));
    }

    @PostMapping(value = "/{productId}/images", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload image to product")
    public ResponseEntity<com.odessi.api.dto.response.ProductImageResponse> uploadImage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(required = false) String altText,
            @RequestParam(required = false) Boolean isPrimary) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            adminService.uploadProductImage(getAdminUser(userDetails), productId, file, altText, isPrimary)
        );
    }

    @PostMapping(value = "/{productId}/video", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload video to product")
    public ResponseEntity<com.odessi.api.dto.response.ProductImageResponse> uploadVideo(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile videoFile,
            @RequestParam(required = false, name = "poster") org.springframework.web.multipart.MultipartFile posterFile,
            @RequestParam(required = false) String altText) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            adminService.uploadProductVideo(getAdminUser(userDetails), productId, videoFile, posterFile, altText)
        );
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    @Operation(summary = "Delete product image")
    public ResponseEntity<Void> deleteImage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId,
            @PathVariable Long imageId) {
        adminService.deleteProductImage(getAdminUser(userDetails), productId, imageId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{productId}/images/{imageId}/primary")
    @Operation(summary = "Set primary product image")
    public ResponseEntity<ProductResponse> setPrimaryImage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId,
            @PathVariable Long imageId) {
        return ResponseEntity.ok(adminService.setPrimaryProductImage(getAdminUser(userDetails), productId, imageId));
    }

    @PutMapping("/{productId}/images/reorder")
    @Operation(summary = "Reorder product images")
    public ResponseEntity<ProductResponse> reorderImages(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId,
            @RequestBody java.util.List<Long> imageIds) {
        return ResponseEntity.ok(adminService.reorderProductImages(getAdminUser(userDetails), productId, imageIds));
    }
}
