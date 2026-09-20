package com.odessi.api.service.impl;

import com.odessi.api.dto.request.CouponRequest;
import com.odessi.api.dto.response.CouponResponse;
import com.odessi.api.dto.response.CouponValidationResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.CouponRepository;
import com.odessi.api.repository.CouponUsageRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.AdminAuditService;
import com.odessi.api.service.CouponService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final UserRepository userRepository;
    private final AdminAuditService auditService;

    public CouponServiceImpl(
            CouponRepository couponRepository,
            CouponUsageRepository couponUsageRepository,
            UserRepository userRepository,
            AdminAuditService auditService) {
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    private CouponResponse toResponse(Coupon c) {
        return new CouponResponse(
            c.getId(),
            c.getCode(),
            c.getDiscountType(),
            c.getDiscountValue(),
            c.getMinOrderAmount(),
            c.getMaxDiscountAmount(),
            c.getStartDate(),
            c.getExpiryDate(),
            c.getTotalUsageLimit(),
            c.getPerCustomerLimit(),
            c.getTimesUsed(),
            c.isActive(),
            c.getCreatedAt(),
            c.getUpdatedAt()
        );
    }

    @Override
    public BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        if (coupon == null || subtotal == null || subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal discount;
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = subtotal.multiply(coupon.getDiscountValue())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscountAmount() != null && discount.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discount = coupon.getMaxDiscountAmount();
            }
        } else {
            discount = coupon.getDiscountValue();
        }

        // Cap discount at total subtotal
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }
        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public CouponValidationResponse validateCoupon(String code, Long userId, BigDecimal subtotal) {
        if (code == null || code.isBlank()) {
            return new CouponValidationResponse(false, "", null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal, subtotal, "Coupon code is empty");
        }

        String normalizedCode = code.trim().toUpperCase();
        Coupon coupon = couponRepository.findByCode(normalizedCode).orElse(null);

        if (coupon == null || !coupon.isActive()) {
            return new CouponValidationResponse(false, normalizedCode, null, BigDecimal.ZERO, BigDecimal.ZERO, subtotal, subtotal, "Invalid or inactive coupon code");
        }

        Instant now = Instant.now();
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            return new CouponValidationResponse(false, normalizedCode, coupon.getDiscountType(), coupon.getDiscountValue(), BigDecimal.ZERO, subtotal, subtotal, "Coupon is not active yet");
        }

        if (coupon.getExpiryDate() != null && now.isAfter(coupon.getExpiryDate())) {
            return new CouponValidationResponse(false, normalizedCode, coupon.getDiscountType(), coupon.getDiscountValue(), BigDecimal.ZERO, subtotal, subtotal, "Coupon has expired");
        }

        if (subtotal != null && coupon.getMinOrderAmount() != null && subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            return new CouponValidationResponse(
                false,
                normalizedCode,
                coupon.getDiscountType(),
                coupon.getDiscountValue(),
                BigDecimal.ZERO,
                subtotal,
                subtotal,
                "Minimum order subtotal of ₹" + coupon.getMinOrderAmount() + " required for coupon " + normalizedCode
            );
        }

        // Check total limit (RESERVED + CONSUMED)
        if (coupon.getTotalUsageLimit() != null) {
            long activeUsages = couponUsageRepository.countByCouponIdAndStatusIn(coupon.getId(), List.of(CouponUsageStatus.RESERVED, CouponUsageStatus.CONSUMED));
            if (activeUsages >= coupon.getTotalUsageLimit()) {
                return new CouponValidationResponse(false, normalizedCode, coupon.getDiscountType(), coupon.getDiscountValue(), BigDecimal.ZERO, subtotal, subtotal, "Coupon usage limit reached");
            }
        }

        // Check per-customer limit (RESERVED + CONSUMED)
        if (userId != null && coupon.getPerCustomerLimit() != null) {
            long userUsages = couponUsageRepository.countByCouponIdAndUserIdAndStatusIn(coupon.getId(), userId, List.of(CouponUsageStatus.RESERVED, CouponUsageStatus.CONSUMED));
            if (userUsages >= coupon.getPerCustomerLimit()) {
                return new CouponValidationResponse(false, normalizedCode, coupon.getDiscountType(), coupon.getDiscountValue(), BigDecimal.ZERO, subtotal, subtotal, "You have already used this coupon maximum allowed times");
            }
        }

        BigDecimal discount = calculateDiscount(coupon, subtotal);
        BigDecimal newSubtotal = subtotal.subtract(discount);
        if (newSubtotal.compareTo(BigDecimal.ZERO) < 0) newSubtotal = BigDecimal.ZERO;

        return new CouponValidationResponse(
            true,
            normalizedCode,
            coupon.getDiscountType(),
            coupon.getDiscountValue(),
            discount,
            subtotal,
            newSubtotal,
            "Coupon applied successfully"
        );
    }

    @Override
    @Transactional
    public CouponUsage reserveCouponUsage(String code, User user, Order order, BigDecimal subtotal) {
        if (code == null || code.isBlank()) {
            return null;
        }

        String normalizedCode = code.trim().toUpperCase();

        // Lock the coupon row for concurrent check
        Coupon coupon = couponRepository.findByCodeForUpdate(normalizedCode)
                .orElseThrow(() -> new BadRequestException("Invalid coupon code: " + normalizedCode));

        if (!coupon.isActive()) {
            throw new BadRequestException("Coupon is no longer active: " + normalizedCode);
        }

        Instant now = Instant.now();
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            throw new BadRequestException("Coupon is not active yet: " + normalizedCode);
        }

        if (coupon.getExpiryDate() != null && now.isAfter(coupon.getExpiryDate())) {
            throw new BadRequestException("Coupon has expired: " + normalizedCode);
        }

        if (subtotal != null && coupon.getMinOrderAmount() != null && subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new BadRequestException("Minimum order subtotal of ₹" + coupon.getMinOrderAmount() + " required");
        }

        // Total usage limit check
        if (coupon.getTotalUsageLimit() != null) {
            long activeUsages = couponUsageRepository.countByCouponIdAndStatusIn(coupon.getId(), List.of(CouponUsageStatus.RESERVED, CouponUsageStatus.CONSUMED));
            if (activeUsages >= coupon.getTotalUsageLimit()) {
                throw new BadRequestException("Coupon redemption limit reached");
            }
        }

        // Per-customer limit check
        if (user != null && coupon.getPerCustomerLimit() != null) {
            long userUsages = couponUsageRepository.countByCouponIdAndUserIdAndStatusIn(coupon.getId(), user.getId(), List.of(CouponUsageStatus.RESERVED, CouponUsageStatus.CONSUMED));
            if (userUsages >= coupon.getPerCustomerLimit()) {
                throw new BadRequestException("You have reached the maximum redemptions for coupon " + normalizedCode);
            }
        }

        CouponUsage usage = new CouponUsage();
        usage.setCoupon(coupon);
        usage.setUser(user);
        usage.setOrder(order);
        usage.setStatus(CouponUsageStatus.RESERVED);
        usage.setReservedAt(now);

        return couponUsageRepository.save(usage);
    }

    @Override
    @Transactional
    public void consumeCouponUsage(Long orderId) {
        CouponUsage usage = couponUsageRepository.findByOrderId(orderId).orElse(null);
        if (usage != null && usage.getStatus() == CouponUsageStatus.RESERVED) {
            usage.setStatus(CouponUsageStatus.CONSUMED);
            usage.setConsumedAt(Instant.now());
            couponUsageRepository.save(usage);

            Coupon coupon = usage.getCoupon();
            coupon.setTimesUsed(coupon.getTimesUsed() + 1);
            couponRepository.save(coupon);
        }
    }

    @Override
    @Transactional
    public void releaseCouponUsage(Long orderId) {
        CouponUsage usage = couponUsageRepository.findByOrderId(orderId).orElse(null);
        if (usage != null && usage.getStatus() == CouponUsageStatus.RESERVED) {
            usage.setStatus(CouponUsageStatus.RELEASED);
            usage.setReleasedAt(Instant.now());
            couponUsageRepository.save(usage);
        }
    }

    @Override
    public List<CouponResponse> getAllCouponsForAdmin() {
        return couponRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public CouponResponse getCouponById(Long id) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("COUPON_NOT_FOUND", "Coupon not found: " + id));
        return toResponse(c);
    }

    @Override
    @Transactional
    public CouponResponse createCoupon(CouponRequest request, String adminEmail) {
        String code = request.code().trim().toUpperCase();
        if (couponRepository.existsByCode(code)) {
            throw new BadRequestException("Coupon code already exists: " + code);
        }

        Coupon c = new Coupon();
        c.setCode(code);
        c.setDiscountType(request.discountType());
        c.setDiscountValue(request.discountValue());
        c.setMinOrderAmount(request.minOrderAmount() != null ? request.minOrderAmount() : BigDecimal.ZERO);
        c.setMaxDiscountAmount(request.maxDiscountAmount());
        c.setStartDate(request.startDate());
        c.setExpiryDate(request.expiryDate());
        c.setTotalUsageLimit(request.totalUsageLimit());
        c.setPerCustomerLimit(request.perCustomerLimit() != null ? request.perCustomerLimit() : 1);
        c.setTimesUsed(0);
        c.setActive(request.active() != null ? request.active() : true);

        Coupon saved = couponRepository.save(c);
        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(admin, "COUPON_CREATED", "Coupon", saved.getId().toString(), "Created coupon " + saved.getCode());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public CouponResponse updateCoupon(Long id, CouponRequest request, String adminEmail) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("COUPON_NOT_FOUND", "Coupon not found: " + id));

        String code = request.code().trim().toUpperCase();
        if (couponRepository.existsByCodeAndIdNot(code, id)) {
            throw new BadRequestException("Coupon code already in use: " + code);
        }

        c.setCode(code);
        c.setDiscountType(request.discountType());
        c.setDiscountValue(request.discountValue());
        c.setMinOrderAmount(request.minOrderAmount() != null ? request.minOrderAmount() : BigDecimal.ZERO);
        c.setMaxDiscountAmount(request.maxDiscountAmount());
        c.setStartDate(request.startDate());
        c.setExpiryDate(request.expiryDate());
        c.setTotalUsageLimit(request.totalUsageLimit());
        if (request.perCustomerLimit() != null) c.setPerCustomerLimit(request.perCustomerLimit());
        if (request.active() != null) c.setActive(request.active());

        Coupon saved = couponRepository.save(c);
        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(admin, "COUPON_UPDATED", "Coupon", saved.getId().toString(), "Updated coupon " + saved.getCode());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public CouponResponse toggleCouponActive(Long id, String adminEmail) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("COUPON_NOT_FOUND", "Coupon not found: " + id));

        c.setActive(!c.isActive());
        Coupon saved = couponRepository.save(c);

        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(admin, "COUPON_ACTIVATED_TOGGLED", "Coupon", id.toString(), "Toggled coupon active to " + c.isActive());

        return toResponse(saved);
    }
}
