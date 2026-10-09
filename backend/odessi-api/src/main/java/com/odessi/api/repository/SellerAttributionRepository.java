package com.odessi.api.repository;

import com.odessi.api.entity.SellerAttribution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerAttributionRepository extends JpaRepository<SellerAttribution, Long> {

    Optional<SellerAttribution> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);

    Page<SellerAttribution> findAllBySellerId(Long sellerId, Pageable pageable);

    @Query("SELECT COUNT(a) FROM SellerAttribution a WHERE a.seller.id = :sellerId AND a.isQualifying = true AND a.qualificationStatus = 'QUALIFIED'")
    int countVerifiedQualifyingSales(@Param("sellerId") Long sellerId);

    @Query("SELECT COUNT(a) FROM SellerAttribution a WHERE a.seller.id = :sellerId AND a.qualificationStatus = 'PENDING'")
    int countPendingAttributedOrders(@Param("sellerId") Long sellerId);

    @Query("SELECT a FROM SellerAttribution a WHERE " +
           "(:sellerId IS NULL OR a.seller.id = :sellerId) AND " +
           "(:status IS NULL OR a.qualificationStatus = :status)")
    Page<SellerAttribution> findAttributionsWithFilter(@Param("sellerId") Long sellerId,
                                                      @Param("status") String status,
                                                      Pageable pageable);

    @Query("SELECT COUNT(a) FROM SellerAttribution a WHERE a.isQualifying = true")
    long countTotalQualifyingSales();

    @Query("SELECT COALESCE(SUM(a.orderTotal), 0) FROM SellerAttribution a WHERE a.isQualifying = true")
    java.math.BigDecimal sumTotalQualifyingOrderValue();

    @Query("SELECT COUNT(a) FROM SellerAttribution a WHERE a.qualificationStatus = 'PENDING'")
    long countPendingAttributions();

    @Query("SELECT COUNT(a) FROM SellerAttribution a WHERE a.qualificationStatus LIKE 'DISQUALIFIED%'")
    long countDisqualifiedAttributions();
}
