package com.odessi.api.service.impl;

import com.odessi.api.dto.admin.*;
import com.odessi.api.dto.response.*;
import com.odessi.api.entity.Category;
import com.odessi.api.entity.InventoryLog;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderStatus;
import com.odessi.api.entity.PaymentStatus;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductVariant;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.*;
import com.odessi.api.repository.*;
import com.odessi.api.service.AdminAuditService;
import com.odessi.api.service.AdminService;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminServiceImpl implements AdminService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final CollectionRepository collectionRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final AdminAuditService auditService;
    private final com.odessi.api.service.MediaStorageService mediaStorageService;

    private final ProductMapper productMapper;
    private final ProductVariantMapper variantMapper;
    private final com.odessi.api.mapper.ProductImageMapper productImageMapper;
    private final OrderMapper orderMapper;
    private final AddressMapper addressMapper;
    private final CategoryMapper categoryMapper;
    private final CollectionMapper collectionMapper;

    private final com.odessi.api.service.NotificationService notificationService;

    public AdminServiceImpl(
            ProductRepository productRepository,
            ProductVariantRepository variantRepository,
            ProductImageRepository productImageRepository,
            CategoryRepository categoryRepository,
            CollectionRepository collectionRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            InventoryLogRepository inventoryLogRepository,
            AdminAuditService auditService,
            com.odessi.api.service.MediaStorageService mediaStorageService,
            com.odessi.api.service.NotificationService notificationService,
            ProductMapper productMapper,
            ProductVariantMapper variantMapper,
            com.odessi.api.mapper.ProductImageMapper productImageMapper,
            OrderMapper orderMapper,
            AddressMapper addressMapper,
            CategoryMapper categoryMapper,
            CollectionMapper collectionMapper) {
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.productImageRepository = productImageRepository;
        this.categoryRepository = categoryRepository;
        this.collectionRepository = collectionRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.inventoryLogRepository = inventoryLogRepository;
        this.auditService = auditService;
        this.mediaStorageService = mediaStorageService;
        this.notificationService = notificationService;
        this.productMapper = productMapper;
        this.variantMapper = variantMapper;
        this.productImageMapper = productImageMapper;
        this.orderMapper = orderMapper;
        this.addressMapper = addressMapper;
        this.categoryMapper = categoryMapper;
        this.collectionMapper = collectionMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getDashboardStats() {
        long totalOrders = orderRepository.count();

        List<Order> paidOrders = orderRepository.findAll().stream()
            .filter(o -> o.getPaymentStatus() == PaymentStatus.CAPTURED || o.getPaymentStatus() == PaymentStatus.PAID || o.getStatus() == OrderStatus.CONFIRMED || o.getStatus() == OrderStatus.DELIVERED || o.getStatus() == OrderStatus.SHIPPED || o.getStatus() == OrderStatus.PROCESSING)
            .toList();

        BigDecimal totalRevenue = paidOrders.stream()
            .map(Order::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingPaymentCount = orderRepository.findAll().stream()
            .filter(o -> o.getStatus() == OrderStatus.PENDING_PAYMENT || o.getStatus() == OrderStatus.PENDING)
            .count();

        long confirmedCount = orderRepository.findAll().stream()
            .filter(o -> o.getStatus() == OrderStatus.CONFIRMED || o.getStatus() == OrderStatus.PROCESSING)
            .count();

        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);
        long totalProducts = productRepository.count();

        List<ProductVariant> allVariants = variantRepository.findAll();
        long lowStockCount = allVariants.stream().filter(v -> v.getStockQuantity() > 0 && v.getStockQuantity() <= 5).count();
        long outOfStockCount = allVariants.stream().filter(v -> v.getStockQuantity() == 0).count();

        PageRequest pageRequest = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<OrderResponse> recentOrders = orderRepository.findAll(pageRequest).getContent().stream()
            .map(orderMapper::toResponse)
            .toList();

        List<ProductResponse> lowStockProducts = productRepository.findAll().stream()
            .filter(p -> p.getVariants().stream().anyMatch(v -> v.getStockQuantity() <= 5))
            .limit(5)
            .map(productMapper::toResponse)
            .toList();

        List<AdminDashboardStatsResponse.AdminUserSummary> recentCustomers = userRepository.findByRole(Role.CUSTOMER, pageRequest).getContent().stream()
            .map(u -> new AdminDashboardStatsResponse.AdminUserSummary(
                u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                u.isEnabled(), u.isEmailVerified(), u.getOrders().size(),
                u.getCreatedAt().toString()
            ))
            .toList();

        return new AdminDashboardStatsResponse(
            totalOrders, totalRevenue, pendingPaymentCount, confirmedCount,
            totalCustomers, totalProducts, lowStockCount, outOfStockCount,
            recentOrders, lowStockProducts, recentCustomers
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(String search, Long categoryId, Long collectionId, Boolean active, Pageable pageable) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (collectionId != null) {
                predicates.add(cb.equal(root.get("collection").get("id"), collectionId));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("description")), pattern),
                    cb.like(cb.lower(root.get("slug")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return productRepository.findAll(spec, pageable).map(productMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findByIdWithVariants(id)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + id));
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse createProduct(User admin, AdminProductRequest request) {
        String slug = request.slug();
        if (slug == null || slug.isBlank()) {
            slug = request.name().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        }
        if (productRepository.existsBySlug(slug)) {
            throw new BadRequestException("SLUG_ALREADY_EXISTS", "Product slug already exists: " + slug);
        }

        if (request.compareAtPrice() != null && request.compareAtPrice().compareTo(request.price()) < 0) {
            throw new BadRequestException("INVALID_COMPARE_AT_PRICE", "Compare At Price must be greater than or equal to Price");
        }

        Product product = new Product();
        product.setName(request.name());
        product.setSlug(slug);
        product.setDescription(request.description());
        product.setShortDescription(request.shortDescription());
        product.setPrice(request.price());
        product.setCompareAtPrice(request.compareAtPrice());
        product.setCurrency(request.currency() != null && !request.currency().isBlank() ? request.currency() : "INR");
        product.setMaterial(request.material());
        product.setFit(request.fit());
        product.setCareInstructions(request.careInstructions());
        product.setFeatured(request.featured());
        product.setBestseller(request.bestseller());
        product.setNewArrival(request.newArrival());
        product.setActive(request.active());

        if (request.categoryId() != null) {
            Category cat = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "Category not found: " + request.categoryId()));
            product.setCategory(cat);
        }

        if (request.collectionId() != null) {
            com.odessi.api.entity.Collection col = collectionRepository.findById(request.collectionId())
                .orElseThrow(() -> new ResourceNotFoundException("COLLECTION_NOT_FOUND", "Collection not found: " + request.collectionId()));
            product.setCollection(col);
        }

        Product savedProduct = productRepository.save(product);

        if (request.variants() != null && !request.variants().isEmpty()) {
            for (AdminVariantRequest vr : request.variants()) {
                if (variantRepository.existsBySku(vr.sku())) {
                    throw new BadRequestException("Duplicate SKU: " + vr.sku());
                }
                ProductVariant variant = new ProductVariant();
                variant.setProduct(savedProduct);
                variant.setSku(vr.sku());
                variant.setSize(vr.size());
                variant.setColor(vr.color());
                variant.setColorHex(vr.colorHex());
                variant.setPrice(vr.price());
                variant.setStockQuantity(vr.stockQuantity());
                variant.setActive(vr.active());
                variantRepository.save(variant);
                savedProduct.getVariants().add(variant);
            }
        }

        auditService.logAction(admin, "PRODUCT_CREATED", "Product", savedProduct.getId().toString(), "Created product " + savedProduct.getName());
        return productMapper.toResponse(savedProduct);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(User admin, Long id, AdminProductRequest request) {
        Product product = productRepository.findByIdWithVariants(id)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + id));

        if (request.compareAtPrice() != null && request.compareAtPrice().compareTo(request.price()) < 0) {
            throw new BadRequestException("INVALID_COMPARE_AT_PRICE", "Compare At Price must be greater than or equal to Price");
        }

        product.setName(request.name());
        product.setDescription(request.description());
        product.setShortDescription(request.shortDescription());
        product.setPrice(request.price());
        product.setCompareAtPrice(request.compareAtPrice());
        product.setCurrency(request.currency() != null && !request.currency().isBlank() ? request.currency() : "INR");
        product.setMaterial(request.material());
        product.setFit(request.fit());
        product.setCareInstructions(request.careInstructions());
        product.setFeatured(request.featured());
        product.setBestseller(request.bestseller());
        product.setNewArrival(request.newArrival());
        product.setActive(request.active());

        Category cat = request.categoryId() != null ? categoryRepository.findById(request.categoryId()).orElse(null) : null;
        product.setCategory(cat);

        com.odessi.api.entity.Collection col = request.collectionId() != null ? collectionRepository.findById(request.collectionId()).orElse(null) : null;
        product.setCollection(col);

        Product updated = productRepository.save(product);
        auditService.logAction(admin, "PRODUCT_UPDATED", "Product", updated.getId().toString(), "Updated product " + updated.getName());
        return productMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductResponse toggleProductActive(User admin, Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + id));
        product.setActive(!product.isActive());
        Product updated = productRepository.save(product);
        auditService.logAction(admin, product.isActive() ? "PRODUCT_ACTIVATED" : "PRODUCT_ARCHIVED", "Product", id.toString(), "Toggled active state to " + product.isActive());
        return productMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductResponse toggleProductFeatured(User admin, Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + id));
        product.setFeatured(!product.isFeatured());
        Product updated = productRepository.save(product);
        auditService.logAction(admin, "PRODUCT_FEATURED_TOGGLED", "Product", id.toString(), "Toggled featured state to " + product.isFeatured());
        return productMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductImageResponse uploadProductImage(User admin, Long productId, org.springframework.web.multipart.MultipartFile file, String altText, Boolean isPrimary) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + productId));

        String imageUrl = mediaStorageService.storeProductImage(file);

        boolean makePrimary = Boolean.TRUE.equals(isPrimary) || product.getImages().isEmpty();
        if (makePrimary) {
            productImageRepository.clearPrimaryForProduct(productId);
        }

        int sortOrder = product.getImages().size();
        com.odessi.api.entity.ProductImage productImage = new com.odessi.api.entity.ProductImage(
            product, imageUrl, altText, sortOrder, makePrimary
        );

        com.odessi.api.entity.ProductImage savedImage = productImageRepository.save(productImage);
        product.addImage(savedImage);

        auditService.logAction(admin, "PRODUCT_IMAGE_UPLOADED", "ProductImage", savedImage.getId().toString(),
            "Uploaded image for product " + product.getName() + " (" + imageUrl + ")");

        return productImageMapper.toResponse(savedImage);
    }

    @Override
    @Transactional
    public ProductImageResponse uploadProductVideo(User admin, Long productId, org.springframework.web.multipart.MultipartFile videoFile, org.springframework.web.multipart.MultipartFile posterFile, String altText) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + productId));

        String videoUrl = mediaStorageService.storeProductVideo(videoFile);
        String posterUrl = (posterFile != null && !posterFile.isEmpty()) ? mediaStorageService.storeProductImage(posterFile) : null;

        int sortOrder = product.getImages().size();
        com.odessi.api.entity.ProductImage mediaItem = new com.odessi.api.entity.ProductImage(
            product, videoUrl, altText, sortOrder, false
        );
        mediaItem.setMediaType("VIDEO");
        mediaItem.setVideoUrl(videoUrl);
        mediaItem.setPosterUrl(posterUrl);

        com.odessi.api.entity.ProductImage savedMedia = productImageRepository.save(mediaItem);
        product.addImage(savedMedia);

        auditService.logAction(admin, "PRODUCT_VIDEO_UPLOADED", "ProductImage", savedMedia.getId().toString(),
            "Uploaded video for product " + product.getName() + " (" + videoUrl + ")");

        return productImageMapper.toResponse(savedMedia);
    }

    @Override
    @Transactional
    public void deleteProductImage(User admin, Long productId, Long imageId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + productId));

        com.odessi.api.entity.ProductImage image = productImageRepository.findById(imageId)
            .orElseThrow(() -> new ResourceNotFoundException("IMAGE_NOT_FOUND", "Image not found: " + imageId));

        if (!image.getProduct().getId().equals(productId)) {
            throw new BadRequestException("INVALID_IMAGE_PRODUCT", "Image does not belong to product: " + productId);
        }

        boolean wasPrimary = image.isPrimary();
        String imageUrl = image.getImageUrl();

        product.removeImage(image);
        productImageRepository.delete(image);
        mediaStorageService.deleteProductImage(imageUrl);

        if (wasPrimary && !product.getImages().isEmpty()) {
            com.odessi.api.entity.ProductImage newPrimary = product.getImages().get(0);
            newPrimary.setPrimary(true);
            productImageRepository.save(newPrimary);
        }

        auditService.logAction(admin, "PRODUCT_IMAGE_DELETED", "ProductImage", imageId.toString(),
            "Deleted image " + imageUrl + " from product " + product.getName());
    }

    @Override
    @Transactional
    public ProductResponse setPrimaryProductImage(User admin, Long productId, Long imageId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + productId));

        com.odessi.api.entity.ProductImage image = productImageRepository.findById(imageId)
            .orElseThrow(() -> new ResourceNotFoundException("IMAGE_NOT_FOUND", "Image not found: " + imageId));

        if (!image.getProduct().getId().equals(productId)) {
            throw new BadRequestException("INVALID_IMAGE_PRODUCT", "Image does not belong to product: " + productId);
        }

        productImageRepository.clearPrimaryForProduct(productId);
        image.setPrimary(true);
        productImageRepository.save(image);

        auditService.logAction(admin, "PRODUCT_IMAGE_SET_PRIMARY", "ProductImage", imageId.toString(),
            "Set primary image for product " + product.getName());

        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse reorderProductImages(User admin, Long productId, List<Long> imageIds) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + productId));

        if (imageIds != null) {
            for (int i = 0; i < imageIds.size(); i++) {
                Long imgId = imageIds.get(i);
                com.odessi.api.entity.ProductImage image = productImageRepository.findById(imgId).orElse(null);
                if (image != null && image.getProduct().getId().equals(productId)) {
                    image.setSortOrder(i);
                    productImageRepository.save(image);
                }
            }
        }

        auditService.logAction(admin, "PRODUCT_IMAGES_REORDERED", "Product", productId.toString(),
            "Reordered images for product " + product.getName());

        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse addVariant(User admin, Long productId, AdminVariantRequest request) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + productId));

        if (variantRepository.existsBySku(request.sku())) {
            throw new BadRequestException("Duplicate SKU: " + request.sku());
        }

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku(request.sku());
        variant.setSize(request.size());
        variant.setColor(request.color());
        variant.setColorHex(request.colorHex());
        variant.setPrice(request.price());
        variant.setStockQuantity(request.stockQuantity());
        variant.setActive(request.active());

        variantRepository.save(variant);
        product.getVariants().add(variant);

        auditService.logAction(admin, "VARIANT_ADDED", "ProductVariant", variant.getId().toString(), "Added variant SKU " + variant.getSku());
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateVariant(User admin, Long productId, Long variantId, AdminVariantRequest request) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + productId));

        ProductVariant variant = variantRepository.findById(variantId)
            .orElseThrow(() -> new ResourceNotFoundException("VARIANT_NOT_FOUND", "Variant not found: " + variantId));

        if (!variant.getSku().equals(request.sku()) && variantRepository.existsBySku(request.sku())) {
            throw new BadRequestException("Duplicate SKU: " + request.sku());
        }

        variant.setSku(request.sku());
        variant.setSize(request.size());
        variant.setColor(request.color());
        variant.setColorHex(request.colorHex());
        variant.setPrice(request.price());
        variant.setStockQuantity(request.stockQuantity());
        variant.setActive(request.active());

        variantRepository.save(variant);
        auditService.logAction(admin, "VARIANT_UPDATED", "ProductVariant", variantId.toString(), "Updated variant SKU " + variant.getSku());
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductVariantResponse> getInventoryVariants(String search, String stockFilter, Pageable pageable) {
        Specification<ProductVariant> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Join<Object, Object> productJoin = root.join("product", JoinType.LEFT);
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("sku")), pattern),
                    cb.like(cb.lower(root.get("color")), pattern),
                    cb.like(cb.lower(root.get("size")), pattern),
                    cb.like(cb.lower(productJoin.get("name")), pattern)
                ));
            }
            if (stockFilter != null && !stockFilter.isBlank()) {
                if ("OUT_OF_STOCK".equalsIgnoreCase(stockFilter)) {
                    predicates.add(cb.equal(root.get("stockQuantity"), 0));
                } else if ("LOW_STOCK".equalsIgnoreCase(stockFilter)) {
                    predicates.add(cb.and(
                        cb.greaterThan(root.get("stockQuantity"), 0),
                        cb.lessThanOrEqualTo(root.get("stockQuantity"), 5)
                    ));
                } else if ("IN_STOCK".equalsIgnoreCase(stockFilter)) {
                    predicates.add(cb.greaterThan(root.get("stockQuantity"), 5));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return variantRepository.findAll(spec, pageable).map(variantMapper::toResponse);
    }

    @Override
    @Transactional
    public InventoryLogResponse adjustInventory(User admin, InventoryAdjustmentRequest request) {
        ProductVariant variant = variantRepository.findById(request.variantId())
            .orElseThrow(() -> new ResourceNotFoundException("VARIANT_NOT_FOUND", "Variant not found: " + request.variantId()));

        int previousQuantity = variant.getStockQuantity();
        int resultingQuantity = previousQuantity + request.quantityChange();

        if (resultingQuantity < 0) {
            throw new BadRequestException("Available stock cannot become negative. Current: " + previousQuantity + ", Delta: " + request.quantityChange());
        }

        variant.setStockQuantity(resultingQuantity);
        ProductVariant updatedVariant = variantRepository.save(variant);

        if (previousQuantity == 0 && resultingQuantity > 0 && notificationService != null) {
            notificationService.dispatchBackInStockNotifications(updatedVariant);
        }

        InventoryLog log = new InventoryLog(
            variant,
            request.quantityChange(),
            previousQuantity,
            resultingQuantity,
            request.reason(),
            admin != null ? admin.getId() : null
        );
        InventoryLog savedLog = inventoryLogRepository.save(log);

        auditService.logAction(admin, "INVENTORY_ADJUSTED", "ProductVariant", variant.getId().toString(),
            "Adjusted stock for SKU " + variant.getSku() + " by " + request.quantityChange() + " (Reason: " + request.reason() + ")");

        return new InventoryLogResponse(
            savedLog.getId(),
            variant.getId(),
            variant.getSku(),
            variant.getProduct() != null ? variant.getProduct().getName() : "Unknown Product",
            variant.getColor() + " / " + variant.getSize(),
            savedLog.getQuantityChange(),
            savedLog.getPreviousQuantity(),
            savedLog.getResultingQuantity(),
            savedLog.getReason(),
            savedLog.getAdminId(),
            savedLog.getCreatedAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryLogResponse> getInventoryLogs(Long variantId, Pageable pageable) {
        Page<InventoryLog> logs = (variantId != null)
            ? inventoryLogRepository.findByVariantIdOrderByCreatedAtDesc(variantId, pageable)
            : inventoryLogRepository.findAll(pageable);

        return logs.map(l -> new InventoryLogResponse(
            l.getId(),
            l.getVariant().getId(),
            l.getVariant().getSku(),
            l.getVariant().getProduct() != null ? l.getVariant().getProduct().getName() : "Product",
            l.getVariant().getColor() + " / " + l.getVariant().getSize(),
            l.getQuantityChange(),
            l.getPreviousQuantity(),
            l.getResultingQuantity(),
            l.getReason(),
            l.getAdminId(),
            l.getCreatedAt()
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrderResponse> getOrders(String search, OrderStatus status, PaymentStatus paymentStatus, Pageable pageable) {
        Specification<Order> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (paymentStatus != null) {
                predicates.add(cb.equal(root.get("paymentStatus"), paymentStatus));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Join<Object, Object> userJoin = root.join("user", JoinType.LEFT);
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("orderNumber")), pattern),
                    cb.like(cb.lower(userJoin.get("email")), pattern),
                    cb.like(cb.lower(userJoin.get("firstName")), pattern),
                    cb.like(cb.lower(userJoin.get("lastName")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return orderRepository.findAll(spec, pageable).map(orderMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("ORDER_NOT_FOUND", "Order not found: " + id));
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(User admin, Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("ORDER_NOT_FOUND", "Order not found: " + orderId));

        OrderStatus currentStatus = order.getStatus();
        if (currentStatus == newStatus) {
            return orderMapper.toResponse(order);
        }

        // Validate allowed state transitions
        boolean valid = false;
        if (currentStatus == OrderStatus.PENDING) {
            valid = (newStatus == OrderStatus.CONFIRMED || newStatus == OrderStatus.CANCELLED);
        } else if (currentStatus == OrderStatus.PENDING_PAYMENT) {
            valid = (newStatus == OrderStatus.CONFIRMED || newStatus == OrderStatus.PAYMENT_FAILED || newStatus == OrderStatus.CANCELLED);
        } else if (currentStatus == OrderStatus.CONFIRMED) {
            valid = (newStatus == OrderStatus.PROCESSING || newStatus == OrderStatus.CANCELLED);
        } else if (currentStatus == OrderStatus.PROCESSING) {
            valid = (newStatus == OrderStatus.SHIPPED || newStatus == OrderStatus.CANCELLED);
        } else if (currentStatus == OrderStatus.SHIPPED) {
            valid = (newStatus == OrderStatus.DELIVERED);
        }

        if (!valid) {
            throw new BadRequestException("Invalid order status transition from " + currentStatus + " to " + newStatus);
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);

        auditService.logAction(admin, "ORDER_STATUS_CHANGED", "Order", orderId.toString(),
            "Updated status from " + currentStatus + " to " + newStatus);

        return orderMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminDashboardStatsResponse.AdminUserSummary> getUsers(String search, Role role, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("phone")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return userRepository.findAll(spec, pageable)
            .map(u -> new AdminDashboardStatsResponse.AdminUserSummary(
                u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                u.isEnabled(), u.isEmailVerified(), u.getOrders().size(),
                u.getCreatedAt().toString()
            ));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "User not found: " + id));

        List<AddressResponse> addresses = user.getAddresses().stream()
            .map(addressMapper::toResponse)
            .toList();

        List<OrderResponse> recentOrders = user.getOrders().stream()
            .map(orderMapper::toResponse)
            .toList();

        return new AdminUserResponse(
            user.getId(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole(),
            user.isEnabled(),
            user.isEmailVerified(),
            user.getCreatedAt(),
            user.getOrders().size(),
            addresses,
            recentOrders
        );
    }

    @Override
    @Transactional
    public AdminUserResponse toggleUserEnabled(User admin, Long id) {
        if (admin != null && admin.getId().equals(id)) {
            throw new BadRequestException("Admin cannot disable their own account");
        }
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "User not found: " + id));

        user.setEnabled(!user.isEnabled());
        userRepository.save(user);

        auditService.logAction(admin, user.isEnabled() ? "USER_ENABLED" : "USER_DISABLED", "User", id.toString(),
            "Toggled user account status to " + user.isEnabled());

        return getUserById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategories() {
        return categoryRepository.findAll().stream().map(categoryMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(User admin, AdminCategoryRequest request) {
        String slug = request.slug();
        if (slug == null || slug.isBlank()) {
            slug = request.name().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        }
        if (categoryRepository.existsBySlug(slug)) {
            throw new BadRequestException("Category slug already exists: " + slug);
        }
        Category cat = new Category(request.name(), slug, request.description(), request.image());
        cat.setActive(request.active());

        Category saved = categoryRepository.save(cat);
        auditService.logAction(admin, "CATEGORY_CREATED", "Category", saved.getId().toString(), "Created category " + saved.getName());
        return categoryMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(User admin, Long id, AdminCategoryRequest request) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "Category not found: " + id));
        cat.setName(request.name());
        cat.setDescription(request.description());
        cat.setImage(request.image());
        cat.setActive(request.active());

        Category updated = categoryRepository.save(cat);
        auditService.logAction(admin, "CATEGORY_UPDATED", "Category", id.toString(), "Updated category " + updated.getName());
        return categoryMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public CategoryResponse toggleCategoryActive(User admin, Long id) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "Category not found: " + id));
        cat.setActive(!cat.isActive());
        Category updated = categoryRepository.save(cat);
        auditService.logAction(admin, "CATEGORY_ACTIVATED_TOGGLED", "Category", id.toString(), "Toggled active to " + cat.isActive());
        return categoryMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CollectionResponse> getCollections() {
        return collectionRepository.findAll().stream().map(collectionMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public CollectionResponse createCollection(User admin, AdminCollectionRequest request) {
        String slug = request.slug();
        if (slug == null || slug.isBlank()) {
            slug = request.name().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        }
        if (collectionRepository.existsBySlug(slug)) {
            throw new BadRequestException("Collection slug already exists: " + slug);
        }
        com.odessi.api.entity.Collection col = new com.odessi.api.entity.Collection(request.name(), slug, request.description(), request.heroImage(), request.featured());
        col.setActive(request.active());

        com.odessi.api.entity.Collection saved = collectionRepository.save(col);
        auditService.logAction(admin, "COLLECTION_CREATED", "Collection", saved.getId().toString(), "Created collection " + saved.getName());
        return collectionMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CollectionResponse updateCollection(User admin, Long id, AdminCollectionRequest request) {
        com.odessi.api.entity.Collection col = collectionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("COLLECTION_NOT_FOUND", "Collection not found: " + id));
        col.setName(request.name());
        col.setDescription(request.description());
        col.setHeroImage(request.heroImage());
        col.setActive(request.active());
        col.setFeatured(request.featured());

        com.odessi.api.entity.Collection updated = collectionRepository.save(col);
        auditService.logAction(admin, "COLLECTION_UPDATED", "Collection", id.toString(), "Updated collection " + updated.getName());
        return collectionMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public CollectionResponse toggleCollectionActive(User admin, Long id) {
        com.odessi.api.entity.Collection col = collectionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("COLLECTION_NOT_FOUND", "Collection not found: " + id));
        col.setActive(!col.isActive());
        com.odessi.api.entity.Collection updated = collectionRepository.save(col);
        auditService.logAction(admin, "COLLECTION_ACTIVATED_TOGGLED", "Collection", id.toString(), "Toggled active to " + col.isActive());
        return collectionMapper.toResponse(updated);
    }
}
