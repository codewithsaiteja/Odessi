package com.odessi.api.repository;

import com.odessi.api.entity.CouponUsage;
import com.odessi.api.entity.CouponUsageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    @Query("SELECT COUNT(cu) FROM CouponUsage cu WHERE cu.coupon.id = :couponId AND cu.status IN (:statuses)")
    long countByCouponIdAndStatusIn(@Param("couponId") Long couponId, @Param("statuses") List<CouponUsageStatus> statuses);

    @Query("SELECT COUNT(cu) FROM CouponUsage cu WHERE cu.coupon.id = :couponId AND cu.user.id = :userId AND cu.status IN (:statuses)")
    long countByCouponIdAndUserIdAndStatusIn(@Param("couponId") Long couponId, @Param("userId") Long userId, @Param("statuses") List<CouponUsageStatus> statuses);

    Optional<CouponUsage> findByOrderId(Long orderId);
}
