package com.odessi.api.repository;

import com.odessi.api.entity.StoreCreditTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreCreditTransactionRepository extends JpaRepository<StoreCreditTransaction, Long> {

    boolean existsByIdempotencyKey(String idempotencyKey);

    Optional<StoreCreditTransaction> findByIdempotencyKey(String idempotencyKey);

    List<StoreCreditTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<StoreCreditTransaction> findByUserId(Long userId, Pageable pageable);
}
