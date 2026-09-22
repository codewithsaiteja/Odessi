package com.odessi.api.repository;

import com.odessi.api.entity.ProductVariant;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long>, JpaSpecificationExecutor<ProductVariant> {

    List<ProductVariant> findByProductId(Long productId);

    List<ProductVariant> findByProductIdAndActiveTrue(Long productId);

    Optional<ProductVariant> findBySku(String sku);

    boolean existsBySku(String sku);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT v FROM ProductVariant v WHERE v.id = :id")
    Optional<ProductVariant> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    // ── Dashboard KPI inventory queries ──────────────────────────────────────

    /**
     * Count low-stock variants: stock > 0 AND stock <= threshold (default 5).
     * Uses DB-side count — avoids loading all variants into memory.
     */
    long countByStockQuantityGreaterThanAndStockQuantityLessThanEqual(int minExclusive, int maxInclusive);

    /**
     * Count out-of-stock variants: stock == 0.
     */
    long countByStockQuantity(int quantity);

    /**
     * Fetch the N worst low-stock variants (ordered by stock ASC) with their
     * product eagerly loaded for the dashboard alert panel.
     * Avoids ProductResponse mapping overhead — fields are projected via the
     * LowStockVariantSummary DTO in the service layer.
     */
    @Query("SELECT v FROM ProductVariant v JOIN FETCH v.product p " +
           "WHERE v.stockQuantity > 0 AND v.stockQuantity <= 5 " +
           "ORDER BY v.stockQuantity ASC")
    List<ProductVariant> findLowStockVariantsWithProduct(Pageable pageable);

    /**
     * Fetch the N worst out-of-stock variants with their product loaded.
     */
    @Query("SELECT v FROM ProductVariant v JOIN FETCH v.product p " +
           "WHERE v.stockQuantity = 0 " +
           "ORDER BY v.id DESC")
    List<ProductVariant> findOutOfStockVariantsWithProduct(Pageable pageable);
}
