package com.odessi.api.service;

import com.odessi.api.dto.request.CouponRequest;
import com.odessi.api.dto.response.CouponResponse;
import com.odessi.api.dto.response.CouponValidationResponse;
import com.odessi.api.entity.Coupon;
import com.odessi.api.entity.CouponUsage;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.User;

import java.math.BigDecimal;
import java.util.List;

public interface CouponService {
    CouponValidationResponse validateCoupon(String code, Long userId, BigDecimal subtotal);
    BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal);
    CouponUsage reserveCouponUsage(String code, User user, Order order, BigDecimal subtotal);
    void consumeCouponUsage(Long orderId);
    void releaseCouponUsage(Long orderId);

    List<CouponResponse> getAllCouponsForAdmin();
    CouponResponse getCouponById(Long id);
    CouponResponse createCoupon(CouponRequest request, String adminEmail);
    CouponResponse updateCoupon(Long id, CouponRequest request, String adminEmail);
    CouponResponse toggleCouponActive(Long id, String adminEmail);
}
