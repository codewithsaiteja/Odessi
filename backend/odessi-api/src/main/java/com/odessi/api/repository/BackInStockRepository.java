package com.odessi.api.repository;

import com.odessi.api.entity.BackInStockRequest;
import com.odessi.api.entity.BackInStockStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BackInStockRepository extends JpaRepository<BackInStockRequest, Long> {
    Optional<BackInStockRequest> findByVariantIdAndEmailAndStatus(Long variantId, String email, BackInStockStatus status);
    List<BackInStockRequest> findByVariantIdAndStatus(Long variantId, BackInStockStatus status);
    Page<BackInStockRequest> findByStatus(BackInStockStatus status, Pageable pageable);
    long countByStatus(BackInStockStatus status);
}
