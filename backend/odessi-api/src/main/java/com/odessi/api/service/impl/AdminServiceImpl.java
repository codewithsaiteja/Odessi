package com.odessi.api.service.impl;

import com.odessi.api.dto.admin.*;
import com.odessi.api.dto.response.*;
import com.odessi.api.entity.Category;
import com.odessi.api.entity.InventoryLog;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderStatus;
import com.odessi.api.entity.PaymentStatus;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.domain.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;


@Service
public class AdminServiceImpl implements AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminServiceImpl.class);

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final CollectionRepository collectionRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
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

    @Autowired(required = false)
    private com.odessi.api.repository.CartItemRepository cartItemRepository;

    @Autowired(required = false)
    private com.odessi.api.repository.WishlistItemRepository wishlistItemRepository;

    @Autowired(required = false)
    private com.odessi.api.service.EmailService emailService;

    @Autowired(required = false)
    private com.odessi.api.repository.OrderStatusEmailLogRepository orderStatusEmailLogRepository;

    public void setEmailService(com.odessi.api.service.EmailService emailService) {
        this.emailService = emailService;
    }

    public void setOrderStatusEmailLogRepository(com.odessi.api.repository.OrderStatusEmailLogRepository orderStatusEmailLogRepository) {
        this.orderStatusEmailLogRepository = orderStatusEmailLogRepository;
    }

    @Autowired
    public AdminServiceImpl(
            ProductRepository productRepository,
            ProductVariantRepository variantRepository,
            ProductImageRepository productImageRepository,
            CategoryRepository categoryRepository,
            CollectionRepository collectionRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            InventoryLogRepository inventoryLogRepository,
            AdminAuditLogRepository adminAuditLogRepository,
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
        this.adminAuditLogRepository = adminAuditLogRepository;
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
        this(productRepository, variantRepository, productImageRepository, categoryRepository, collectionRepository,
             orderRepository, userRepository, inventoryLogRepository, null, auditService, mediaStorageService,
             notificationService, productMapper, variantMapper, productImageMapper, orderMapper, addressMapper,
             categoryMapper, collectionMapper);
    }

    /**
     * IST timezone used for "Today" boundary calculation.
     * All Instants stored in DB are UTC; we convert IST wall-clock boundaries to UTC Instants.
     */
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    /**
     * Payment statuses that represent authoritative captured/successful revenue.
     * PENDING, FAILED, and REFUNDED are excluded from revenue calculations.
     */
    private static final List<PaymentStatus> REVENUE_STATUSES = List.of(PaymentStatus.CAPTURED, PaymentStatus.PAID);

    /**
     * Order statuses treated as "confirmed" (i.e., accepted and in progress).
     */
    private static final List<OrderStatus> CONFIRMED_STATUSES = List.of(OrderStatus.CONFIRMED, OrderStatus.PROCESSING);

    /**
     * Order statuses treated as "pending payment" (i.e., awaiting payment capture).
     */
    private static final List<OrderStatus> PENDING_STATUSES = List.of(OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING);

    /**
     * Low-stock threshold: variants with stock > 0 AND stock <= this value are flagged.
     */
    private static final int LOW_STOCK_THRESHOLD = 5;

    /**
     * Maximum rows returned in the Recent Orders and Low Stock panels.
     */
    private static final int DASHBOARD_ROW_LIMIT = 10;

    /**
     * Resolves a range string into a half-open [start, end) Instant window.
     *
     * <p>Convention:
     * <ul>
     *   <li>TODAY: [startOfDayIST, startOfNextDayIST) — uses IST calendar day</li>
     *   <li>7_DAYS: [now − 7 days, now)</li>
     *   <li>30_DAYS: [now − 30 days, now)</li>
     *   <li>90_DAYS: [now − 90 days, now)</li>
     *   <li>ALL / unknown: returns null (no date filter)</li>
     * </ul>
     *
     * @return a two-element array [start, end], or null for ALL-time (no window)
     */
    private Instant[] resolveWindow(String range) {
        if (range == null) return null;
        Instant now = Instant.now();
        return switch (range.toUpperCase().trim()) {
            case "TODAY" -> {
                LocalDate today = LocalDate.now(IST);
                Instant start = today.atStartOfDay(IST).toInstant();
                Instant end   = today.plusDays(1).atStartOfDay(IST).toInstant();
                yield new Instant[]{start, end};
            }
            case "7_DAYS"  -> new Instant[]{now.minusSeconds(7L  * 86_400), now};
            case "30_DAYS" -> new Instant[]{now.minusSeconds(30L * 86_400), now};
            case "90_DAYS" -> new Instant[]{now.minusSeconds(90L * 86_400), now};
            default -> null; // ALL or unrecognised — no date filter
        };
    }

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getDashboardStats(String range) {
        Instant[] window = resolveWindow(range);
        boolean hasWindow = window != null;
        Instant start = hasWindow ? window[0] : null;
        Instant end   = hasWindow ? window[1] : null;

        // ── Total Orders ────────────────────────────────────────────────────
        long totalOrders = hasWindow
            ? orderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(start, end)
            : orderRepository.count();

        // ── Revenue (CAPTURED / PAID only) ──────────────────────────────────
        // Only payments that have been fully captured are treated as revenue.
        // PENDING, FAILED, and REFUNDED statuses are explicitly excluded.
        BigDecimal totalRevenue = hasWindow
            ? orderRepository.sumRevenueInWindow(REVENUE_STATUSES, start, end)
            : orderRepository.sumRevenueAllTime(REVENUE_STATUSES);
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        // ── Status sub-counts ───────────────────────────────────────────────
        long confirmedCount = hasWindow
            ? orderRepository.countByStatusInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(CONFIRMED_STATUSES, start, end)
            : orderRepository.countByStatusIn(CONFIRMED_STATUSES);

        long pendingPaymentCount = hasWindow
            ? orderRepository.countByStatusInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(PENDING_STATUSES, start, end)
            : orderRepository.countByStatusIn(PENDING_STATUSES);

        // ── Customers ───────────────────────────────────────────────────────
        // totalCustomers is always all-time registered customer count.
        // The label "Registered customer accounts" makes this clear in the UI.
        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);

        // ── Products ────────────────────────────────────────────────────────
        long totalProducts = productRepository.count();

        // ── Inventory alerts (DB-side counts, no full table load) ───────────
        long lowStockCount = variantRepository
            .countByStockQuantityGreaterThanAndStockQuantityLessThanEqual(0, LOW_STOCK_THRESHOLD);
        long outOfStockCount = variantRepository.countByStockQuantity(0);

        // ── Recent Orders (JOIN FETCH user — no N+1) ────────────────────────
        PageRequest orderPage = PageRequest.of(0, DASHBOARD_ROW_LIMIT);
        List<Order> rawOrders = hasWindow
            ? orderRepository.findRecentOrdersInWindow(start, end, orderPage)
            : orderRepository.findRecentOrdersAllTime(orderPage);

        List<DashboardOrderSummary> recentOrders = rawOrders.stream()
            .map(o -> {
                User u = o.getUser();
                String name  = u != null ? (u.getFirstName() + " " + u.getLastName()).trim() : "Guest";
                String email = u != null ? u.getEmail() : null;
                return new DashboardOrderSummary(
                    o.getId(),
                    o.getOrderNumber(),
                    u != null ? u.getId() : null,
                    name.isBlank() ? "Guest" : name,
                    email,
                    o.getTotalAmount(),
                    o.getCurrency(),
                    o.getStatus(),
                    o.getPaymentStatus(),
                    o.getCreatedAt()
                );
            })
            .toList();

        // ── Low Stock alert panel (JOIN FETCH product — no N+1) ─────────────
        PageRequest variantPage = PageRequest.of(0, DASHBOARD_ROW_LIMIT);
        List<ProductVariant> lowVariants = variantRepository.findLowStockVariantsWithProduct(variantPage);
        List<AdminDashboardStatsResponse.LowStockVariantSummary> lowStockProducts = lowVariants.stream()
            .map(v -> new AdminDashboardStatsResponse.LowStockVariantSummary(
                v.getId(),
                v.getProduct() != null ? v.getProduct().getName() : "Unknown",
                v.getSku(),
                v.getSize(),
                v.getColor(),
                v.getStockQuantity()
            ))
            .toList();

        // ── Recent customers (for customer widget) ───────────────────────────
        PageRequest customerPage = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<AdminDashboardStatsResponse.AdminUserSummary> recentCustomers =
            userRepository.findByRole(Role.CUSTOMER, customerPage).getContent().stream()
                .map(u -> new AdminDashboardStatsResponse.AdminUserSummary(
                    u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(),
                    u.isEnabled(), u.isEmailVerified(),
                    // Use order count from the already-loaded collection;
                    // no separate query needed since user.orders is a bidirectional collection.
                    // If this causes N+1 concerns at scale, replace with a @Query count.
                    (long) u.getOrders().size(),
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
    public Page<ProductResponse> getProducts(String search, Long categoryId, Long collectionId, Boolean active, String status, Pageable pageable) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isBlank()) {
                com.odessi.api.entity.ProductStatus pStatus = com.odessi.api.entity.ProductStatus.fromString(status);
                predicates.add(cb.equal(root.get("status"), pStatus));
            } else if (active != null) {
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

        if (request.status() != null && !request.status().isBlank()) {
            product.setStatus(com.odessi.api.entity.ProductStatus.fromString(request.status()));
        } else {
            product.setActive(request.active());
        }

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

        auditService.logAction(admin, "PRODUCT_CREATED", "Product", savedProduct.getId().toString(), "Created product " + savedProduct.getName() + " with status " + savedProduct.getStatus());
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

        if (request.status() != null && !request.status().isBlank()) {
            product.setStatus(com.odessi.api.entity.ProductStatus.fromString(request.status()));
        } else {
            product.setActive(request.active());
        }

        Category cat = request.categoryId() != null ? categoryRepository.findById(request.categoryId()).orElse(null) : null;
        product.setCategory(cat);

        com.odessi.api.entity.Collection col = request.collectionId() != null ? collectionRepository.findById(request.collectionId()).orElse(null) : null;
        product.setCollection(col);

        Product updated = productRepository.save(product);
        auditService.logAction(admin, "PRODUCT_UPDATED", "Product", updated.getId().toString(), "Updated product " + updated.getName() + " (status: " + updated.getStatus() + ")");
        return productMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public ProductResponse toggleProductActive(User admin, Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + id));
        product.setActive(!product.isActive());
        Product updated = productRepository.save(product);
        auditService.logAction(admin, product.isActive() ? "PRODUCT_ACTIVATED" : "PRODUCT_ARCHIVED", "Product", id.toString(), "Toggled active state to " + product.isActive() + " (status: " + product.getStatus() + ")");
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
    public ProductResponse duplicateProduct(User admin, Long id) {
        Product original = productRepository.findByIdWithVariants(id)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + id));

        long suffix = System.currentTimeMillis() % 10000;
        String newSlug = original.getSlug() + "-copy-" + suffix;
        if (productRepository.existsBySlug(newSlug)) {
            newSlug = original.getSlug() + "-copy-" + System.currentTimeMillis();
        }

        Product copy = new Product();
        copy.setName(original.getName() + " (Copy)");
        copy.setSlug(newSlug);
        copy.setDescription(original.getDescription());
        copy.setShortDescription(original.getShortDescription());
        copy.setPrice(original.getPrice());
        copy.setCompareAtPrice(original.getCompareAtPrice());
        copy.setCurrency(original.getCurrency());
        copy.setCategory(original.getCategory());
        copy.setCollection(original.getCollection());
        copy.setMaterial(original.getMaterial());
        copy.setFit(original.getFit());
        copy.setCareInstructions(original.getCareInstructions());
        copy.setFeatured(false);
        copy.setBestseller(false);
        copy.setNewArrival(false);
        copy.setStatus(com.odessi.api.entity.ProductStatus.DRAFT);
        copy.setActive(false);

        Product savedCopy = productRepository.save(copy);

        if (original.getVariants() != null) {
            for (ProductVariant v : original.getVariants()) {
                ProductVariant copyVariant = new ProductVariant();
                copyVariant.setProduct(savedCopy);
                copyVariant.setSku(v.getSku() + "-COPY-" + suffix);
                copyVariant.setSize(v.getSize());
                copyVariant.setColor(v.getColor());
                copyVariant.setColorHex(v.getColorHex());
                copyVariant.setPrice(v.getPrice());
                copyVariant.setStockQuantity(v.getStockQuantity());
                copyVariant.setActive(v.isActive());
                variantRepository.save(copyVariant);
                savedCopy.getVariants().add(copyVariant);
            }
        }

        if (original.getImages() != null) {
            for (com.odessi.api.entity.ProductImage img : original.getImages()) {
                com.odessi.api.entity.ProductImage copyImg = new com.odessi.api.entity.ProductImage(
                    savedCopy, img.getImageUrl(), img.getAltText(), img.getSortOrder(), img.isPrimary()
                );
                copyImg.setMediaType(img.getMediaType());
                copyImg.setVideoUrl(img.getVideoUrl());
                copyImg.setPosterUrl(img.getPosterUrl());
                productImageRepository.save(copyImg);
                savedCopy.getImages().add(copyImg);
            }
        }

        auditService.logAction(admin, "PRODUCT_DUPLICATED", "Product", savedCopy.getId().toString(),
            "Duplicated product " + original.getName() + " -> " + savedCopy.getName() + " (ID: " + savedCopy.getId() + ")");

        return productMapper.toResponse(savedCopy);
    }

    @Override
    @Transactional
    public DeleteProductResult deleteProduct(User admin, Long id) {
        Product product = productRepository.findByIdWithVariants(id)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + id));

        // Fast indexed check for historical customer order references
        boolean hasOrders = orderRepository.existsByProductIdInOrderItems(id);

        if (hasOrders) {
            product.setStatus(com.odessi.api.entity.ProductStatus.ARCHIVED);
            product.setActive(false);
            productRepository.save(product);
            auditService.logAction(admin, "PRODUCT_ARCHIVED_SAFE_DELETE", "Product", id.toString(),
                "Product " + product.getName() + " has historical order items. Safely archived instead of hard delete.");
            return new DeleteProductResult("Product has historical customer order records and was safely archived.", true);
        }

        // Clean up transient unpurchased cart items and wishlist items before deleting
        if (cartItemRepository != null) {
            cartItemRepository.deleteAllByProductId(id);
        }
        if (wishlistItemRepository != null) {
            wishlistItemRepository.deleteAllByProductId(id);
        }

        // Delete associated image blobs from storage
        if (product.getImages() != null) {
            for (ProductImage img : product.getImages()) {
                if (img.getImageUrl() != null) {
                    try {
                        mediaStorageService.deleteProductImage(img.getImageUrl());
                    } catch (Exception e) {
                        log.warn("Failed to delete storage blob for product {}: {}", id, e.getMessage());
                    }
                }
            }
        }

        // True deletion when safe
        productRepository.delete(product);
        auditService.logAction(admin, "PRODUCT_HARD_DELETED", "Product", id.toString(),
            "Hard deleted product " + product.getName() + " (ID: " + id + ")");
        return new DeleteProductResult("Product was deleted successfully.", false);
    }

    @Override
    @Transactional
    public List<ProductResponse> bulkProductAction(User admin, AdminBulkProductRequest request) {
        if (request.productIds() == null || request.productIds().isEmpty()) {
            throw new BadRequestException("No product IDs specified for bulk action.");
        }

        List<Product> products = productRepository.findAllById(request.productIds());
        List<ProductResponse> updatedList = new ArrayList<>();
        String actionUpper = request.action().trim().toUpperCase();

        com.odessi.api.entity.Collection colTarget = null;
        if ("ASSIGN_COLLECTION".equals(actionUpper) && request.collectionId() != null) {
            colTarget = collectionRepository.findById(request.collectionId()).orElse(null);
        }

        for (Product product : products) {
            if ("DELETE".equals(actionUpper)) {
                deleteProduct(admin, product.getId());
                continue;
            }
            switch (actionUpper) {
                case "PUBLISH" -> product.setStatus(com.odessi.api.entity.ProductStatus.PUBLISHED);
                case "HIDE" -> product.setStatus(com.odessi.api.entity.ProductStatus.HIDDEN);
                case "ARCHIVE" -> product.setStatus(com.odessi.api.entity.ProductStatus.ARCHIVED);
                case "DRAFT" -> product.setStatus(com.odessi.api.entity.ProductStatus.DRAFT);
                case "FEATURE" -> product.setFeatured(true);
                case "UNFEATURE" -> product.setFeatured(false);
                case "ASSIGN_COLLECTION" -> product.setCollection(colTarget);
                default -> throw new BadRequestException("Unsupported bulk action: " + request.action());
            }
            Product saved = productRepository.save(product);
            updatedList.add(productMapper.toResponse(saved));
        }

        auditService.logAction(admin, "BULK_PRODUCT_ACTION_" + actionUpper, "Product",
            request.productIds().toString(), "Applied bulk action " + actionUpper + " to " + products.size() + " products");

        return updatedList;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminAuditLogResponse> getProductActivity(Long id) {
        return adminAuditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("Product", id.toString())
            .stream()
            .map(log -> new AdminAuditLogResponse(
                log.getId(),
                log.getAdminId(),
                log.getAdminEmail(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDetails(),
                log.getCreatedAt()
            ))
            .toList();
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
            throw new BadRequestException("DUPLICATE_SKU", "Duplicate SKU: " + request.sku());
        }

        boolean duplicateCombo = product.getVariants().stream()
            .anyMatch(v -> v.getSize().equalsIgnoreCase(request.size().trim()) &&
                           v.getColor().equalsIgnoreCase(request.color().trim()));
        if (duplicateCombo) {
            throw new BadRequestException("DUPLICATE_VARIANT_COMBO",
                "A variant with size '" + request.size() + "' and color '" + request.color() + "' already exists for this product.");
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
            throw new BadRequestException("DUPLICATE_SKU", "Duplicate SKU: " + request.sku());
        }

        boolean duplicateCombo = product.getVariants().stream()
            .anyMatch(v -> !v.getId().equals(variantId) &&
                           v.getSize().equalsIgnoreCase(request.size().trim()) &&
                           v.getColor().equalsIgnoreCase(request.color().trim()));
        if (duplicateCombo) {
            throw new BadRequestException("DUPLICATE_VARIANT_COMBO",
                "A variant with size '" + request.size() + "' and color '" + request.color() + "' already exists for this product.");
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
    @Transactional
    public ProductResponse deleteVariant(User admin, Long productId, Long variantId) {
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + productId));

        ProductVariant variant = variantRepository.findById(variantId)
            .orElseThrow(() -> new ResourceNotFoundException("VARIANT_NOT_FOUND", "Variant not found: " + variantId));

        product.getVariants().remove(variant);
        variantRepository.delete(variant);
        auditService.logAction(admin, "VARIANT_DELETED", "ProductVariant", variantId.toString(), "Deleted variant SKU " + variant.getSku());
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
        Order order = orderRepository.findByIdWithItems(id)
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
            valid = (newStatus == OrderStatus.OUT_FOR_DELIVERY || newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.CANCELLED);
        } else if (currentStatus == OrderStatus.OUT_FOR_DELIVERY) {
            valid = (newStatus == OrderStatus.DELIVERED || newStatus == OrderStatus.CANCELLED);
        }

        if (!valid) {
            throw new BadRequestException("Invalid order status transition from " + currentStatus + " to " + newStatus);
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);

        auditService.logAction(admin, "ORDER_STATUS_CHANGED", "Order", orderId.toString(),
            "Updated status from " + currentStatus + " to " + newStatus);

        sendStatusUpdateEmailIfEligible(updated, currentStatus, newStatus);

        return orderMapper.toResponse(updated);
    }

    private void sendStatusUpdateEmailIfEligible(Order order, OrderStatus previousStatus, OrderStatus newStatus) {
        if (emailService == null || order == null || previousStatus == newStatus) {
            return;
        }

        // Only send status emails for customer-facing order status updates
        boolean isEligibleStatus = (newStatus == OrderStatus.PROCESSING
            || newStatus == OrderStatus.SHIPPED
            || newStatus == OrderStatus.OUT_FOR_DELIVERY
            || newStatus == OrderStatus.DELIVERED
            || newStatus == OrderStatus.CANCELLED);

        if (!isEligibleStatus) {
            return;
        }

        Long orderId = order.getId();
        if (orderId == null) {
            return;
        }

        // Database-backed idempotency check: Skip if status email was already logged
        if (orderStatusEmailLogRepository != null && orderStatusEmailLogRepository.existsByOrderIdAndOrderStatus(orderId, newStatus)) {
            log.info("Order status update email already recorded/sent for order {} and status {}. Skipping duplicate email.", orderId, newStatus);
            return;
        }

        try {
            Order fullOrder = orderRepository.findByIdWithItems(orderId).orElse(order);

            // Record log to enforce database-level duplicate protection
            if (orderStatusEmailLogRepository != null) {
                com.odessi.api.entity.OrderStatusEmailLog emailLog = new com.odessi.api.entity.OrderStatusEmailLog(
                    fullOrder,
                    newStatus,
                    fullOrder.getCustomerEmail(),
                    null
                );
                orderStatusEmailLogRepository.save(emailLog);
            }

            emailService.sendOrderStatusUpdateEmail(fullOrder, previousStatus, newStatus);
            log.info("Sent order status update email for order {} ({} -> {}) to {}",
                fullOrder.getOrderNumber(), previousStatus, newStatus, fullOrder.getCustomerEmail());
        } catch (Exception e) {
            log.error("Failed to dispatch order status update email for order {} to {}: {}",
                order.getOrderNumber(), order.getCustomerEmail(), e.getMessage(), e);
        }
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
        String image = (request.image() != null && !request.image().isBlank()) ? request.image().trim() : null;
        Category cat = new Category(request.name(), slug, request.description(), image);
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
        String image = (request.image() != null && !request.image().isBlank()) ? request.image().trim() : null;
        cat.setImage(image);
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
    @Transactional
    public com.odessi.api.dto.response.CategoryResponse uploadCategoryImage(User admin, Long id, org.springframework.web.multipart.MultipartFile file) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "Category not found: " + id));

        // 1. Store new image (validates and uploads)
        String newImageUrl = mediaStorageService.storeCategoryImage(file);

        // 2. Capture old image path before overwriting
        String oldImageUrl = cat.getImage();

        // 3. Update category with new image reference
        cat.setImage(newImageUrl);
        Category updated = categoryRepository.save(cat);

        // 4. Delete old image ONLY after successful save
        if (oldImageUrl != null && !oldImageUrl.isBlank()) {
            try {
                mediaStorageService.deleteCategoryImage(oldImageUrl);
            } catch (Exception e) {
                log.warn("[Admin] Could not delete old category image {}: {}", oldImageUrl, e.getMessage());
            }
        }

        auditService.logAction(admin, "CATEGORY_IMAGE_UPLOADED", "Category", id.toString(),
            "Uploaded category image: " + newImageUrl);
        return categoryMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public com.odessi.api.dto.response.CategoryResponse removeCategoryImage(User admin, Long id) {
        Category cat = categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "Category not found: " + id));

        String oldImageUrl = cat.getImage();
        cat.setImage(null);
        Category updated = categoryRepository.save(cat);

        // Delete the image from storage after successful save
        if (oldImageUrl != null && !oldImageUrl.isBlank()) {
            try {
                mediaStorageService.deleteCategoryImage(oldImageUrl);
            } catch (Exception e) {
                log.warn("[Admin] Could not delete category image {}: {}", oldImageUrl, e.getMessage());
            }
        }

        auditService.logAction(admin, "CATEGORY_IMAGE_REMOVED", "Category", id.toString(),
            "Removed category image (was: " + oldImageUrl + ")");
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
