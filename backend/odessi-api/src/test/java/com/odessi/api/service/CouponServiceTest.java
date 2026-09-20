package com.odessi.api.service;

import com.odessi.api.dto.request.CouponRequest;
import com.odessi.api.dto.response.CouponResponse;
import com.odessi.api.dto.response.CouponValidationResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.CouponRepository;
import com.odessi.api.repository.CouponUsageRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.impl.CouponServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private CouponUsageRepository couponUsageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AdminAuditService auditService;

    private CouponServiceImpl couponService;

    private Coupon percentageCoupon;
    private Coupon fixedCoupon;
    private User testUser;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        couponService = new CouponServiceImpl(couponRepository, couponUsageRepository, userRepository, auditService);

        percentageCoupon = new Coupon();
        percentageCoupon.setId(10L);
        percentageCoupon.setCode("HERO20");
        percentageCoupon.setDiscountType(DiscountType.PERCENTAGE);
        percentageCoupon.setDiscountValue(new BigDecimal("20.00"));
        percentageCoupon.setMinOrderAmount(new BigDecimal("1000.00"));
        percentageCoupon.setMaxDiscountAmount(new BigDecimal("500.00"));
        percentageCoupon.setTotalUsageLimit(100);
        percentageCoupon.setPerCustomerLimit(1);
        percentageCoupon.setTimesUsed(5);
        percentageCoupon.setActive(true);

        fixedCoupon = new Coupon();
        fixedCoupon.setId(20L);
        fixedCoupon.setCode("FLAT200");
        fixedCoupon.setDiscountType(DiscountType.FIXED_AMOUNT);
        fixedCoupon.setDiscountValue(new BigDecimal("200.00"));
        fixedCoupon.setMinOrderAmount(new BigDecimal("500.00"));
        fixedCoupon.setTotalUsageLimit(50);
        fixedCoupon.setPerCustomerLimit(2);
        fixedCoupon.setTimesUsed(0);
        fixedCoupon.setActive(true);

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("customer@odessi.com");

        testOrder = new Order();
        testOrder.setId(100L);
        testOrder.setOrderNumber("ODR-TEST-001");
    }

    @Test
    @DisplayName("validateCoupon: calculates percentage discount capped by maxDiscountAmount")
    void validateCoupon_PercentageCapped() {
        when(couponRepository.findByCode("HERO20")).thenReturn(Optional.of(percentageCoupon));

        CouponValidationResponse res = couponService.validateCoupon("HERO20", 1L, new BigDecimal("3000.00"));

        assertThat(res.valid()).isTrue();
        assertThat(res.calculatedDiscount()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(res.newSubtotal()).isEqualByComparingTo(new BigDecimal("2500.00"));
    }

    @Test
    @DisplayName("validateCoupon: fails if subtotal is below minimum order amount")
    void validateCoupon_BelowMinOrderAmount() {
        when(couponRepository.findByCode("HERO20")).thenReturn(Optional.of(percentageCoupon));

        CouponValidationResponse res = couponService.validateCoupon("HERO20", 1L, new BigDecimal("800.00"));

        assertThat(res.valid()).isFalse();
        assertThat(res.calculatedDiscount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(res.message()).contains("Minimum order subtotal");
    }

    @Test
    @DisplayName("reserveCouponUsage: creates CouponUsage in RESERVED state")
    void reserveCouponUsage_Success() {
        when(couponRepository.findByCodeForUpdate("HERO20")).thenReturn(Optional.of(percentageCoupon));
        when(couponUsageRepository.save(any(CouponUsage.class))).thenAnswer(invocation -> {
            CouponUsage u = invocation.getArgument(0);
            u.setId(500L);
            return u;
        });

        CouponUsage usage = couponService.reserveCouponUsage("HERO20", testUser, testOrder, new BigDecimal("2000.00"));

        assertThat(usage.getId()).isEqualTo(500L);
        assertThat(usage.getStatus()).isEqualTo(CouponUsageStatus.RESERVED);
        assertThat(usage.getCoupon().getCode()).isEqualTo("HERO20");
    }

    @Test
    @DisplayName("consumeCouponUsage: transitions RESERVED to CONSUMED and increments timesUsed")
    void consumeCouponUsage_Success() {
        CouponUsage usage = new CouponUsage();
        usage.setId(500L);
        usage.setCoupon(percentageCoupon);
        usage.setUser(testUser);
        usage.setOrder(testOrder);
        usage.setStatus(CouponUsageStatus.RESERVED);

        when(couponUsageRepository.findByOrderId(100L)).thenReturn(Optional.of(usage));

        couponService.consumeCouponUsage(100L);

        assertThat(usage.getStatus()).isEqualTo(CouponUsageStatus.CONSUMED);
        assertThat(usage.getConsumedAt()).isNotNull();
        assertThat(percentageCoupon.getTimesUsed()).isEqualTo(6);
    }

    @Test
    @DisplayName("releaseCouponUsage: transitions RESERVED to RELEASED without incrementing timesUsed")
    void releaseCouponUsage_Success() {
        CouponUsage usage = new CouponUsage();
        usage.setId(500L);
        usage.setCoupon(percentageCoupon);
        usage.setUser(testUser);
        usage.setOrder(testOrder);
        usage.setStatus(CouponUsageStatus.RESERVED);

        when(couponUsageRepository.findByOrderId(100L)).thenReturn(Optional.of(usage));

        couponService.releaseCouponUsage(100L);

        assertThat(usage.getStatus()).isEqualTo(CouponUsageStatus.RELEASED);
        assertThat(usage.getReleasedAt()).isNotNull();
        assertThat(percentageCoupon.getTimesUsed()).isEqualTo(5);
    }

    @Test
    @DisplayName("createCoupon: saves coupon and logs audit action")
    void createCoupon_Success() {
        when(couponRepository.existsByCode("SUMMER30")).thenReturn(false);
        when(couponRepository.save(any(Coupon.class))).thenAnswer(i -> {
            Coupon c = i.getArgument(0);
            c.setId(30L);
            return c;
        });

        CouponRequest req = new CouponRequest("SUMMER30", DiscountType.PERCENTAGE, new BigDecimal("30.00"), new BigDecimal("1000.00"), new BigDecimal("600.00"), null, null, 200, 1, true);
        CouponResponse res = couponService.createCoupon(req, "admin@odessi.com");

        assertThat(res.id()).isEqualTo(30L);
        assertThat(res.code()).isEqualTo("SUMMER30");
        verify(auditService, times(1)).logAction(any(), eq("COUPON_CREATED"), eq("Coupon"), eq("30"), any());
    }
}
