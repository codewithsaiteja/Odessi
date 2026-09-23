package com.odessi.api.service;

import com.odessi.api.dto.admin.*;
import com.odessi.api.dto.response.*;
import com.odessi.api.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminService {
    /**
     * Returns dashboard KPIs filtered by the given range string.
     *
     * @param range one of: TODAY, 7_DAYS, 30_DAYS, 90_DAYS, ALL (case-insensitive).
     *              Unknown values fall back to ALL.
     */
    AdminDashboardStatsResponse getDashboardStats(String range);

    record DeleteProductResult(String message, boolean archived) {}

    Page<ProductResponse> getProducts(String search, Long categoryId, Long collectionId, Boolean active, String status, Pageable pageable);
    ProductResponse getProductById(Long id);
    ProductResponse createProduct(User admin, AdminProductRequest request);
    ProductResponse updateProduct(User admin, Long id, AdminProductRequest request);
    ProductResponse toggleProductActive(User admin, Long id);
    ProductResponse toggleProductFeatured(User admin, Long id);
    ProductResponse duplicateProduct(User admin, Long id);
    DeleteProductResult deleteProduct(User admin, Long id);
    List<ProductResponse> bulkProductAction(User admin, AdminBulkProductRequest request);
    List<AdminAuditLogResponse> getProductActivity(Long id);

    ProductImageResponse uploadProductImage(User admin, Long productId, org.springframework.web.multipart.MultipartFile file, String altText, Boolean isPrimary);
    ProductImageResponse uploadProductVideo(User admin, Long productId, org.springframework.web.multipart.MultipartFile videoFile, org.springframework.web.multipart.MultipartFile posterFile, String altText);
    void deleteProductImage(User admin, Long productId, Long imageId);
    ProductResponse setPrimaryProductImage(User admin, Long productId, Long imageId);
    ProductResponse reorderProductImages(User admin, Long productId, List<Long> imageIds);

    ProductResponse addVariant(User admin, Long productId, AdminVariantRequest request);
    ProductResponse updateVariant(User admin, Long productId, Long variantId, AdminVariantRequest request);
    ProductResponse deleteVariant(User admin, Long productId, Long variantId);

    Page<ProductVariantResponse> getInventoryVariants(String search, String stockFilter, Pageable pageable);
    InventoryLogResponse adjustInventory(User admin, InventoryAdjustmentRequest request);
    Page<InventoryLogResponse> getInventoryLogs(Long variantId, Pageable pageable);

    Page<OrderResponse> getOrders(String search, OrderStatus status, PaymentStatus paymentStatus, Pageable pageable);
    OrderResponse getOrderById(Long id);
    OrderResponse updateOrderStatus(User admin, Long orderId, OrderStatus newStatus);

    Page<AdminDashboardStatsResponse.AdminUserSummary> getUsers(String search, Role role, Pageable pageable);
    AdminUserResponse getUserById(Long id);
    AdminUserResponse toggleUserEnabled(User admin, Long id);

    List<CategoryResponse> getCategories();
    CategoryResponse createCategory(User admin, AdminCategoryRequest request);
    CategoryResponse updateCategory(User admin, Long id, AdminCategoryRequest request);
    CategoryResponse toggleCategoryActive(User admin, Long id);

    List<CollectionResponse> getCollections();
    CollectionResponse createCollection(User admin, AdminCollectionRequest request);
    CollectionResponse updateCollection(User admin, Long id, AdminCollectionRequest request);
    CollectionResponse toggleCollectionActive(User admin, Long id);
}
