package com.odessi.api.repository;

import com.odessi.api.entity.SellerAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SellerAuditLogRepository extends JpaRepository<SellerAuditLog, Long> {

    List<SellerAuditLog> findAllBySellerIdOrderByCreatedAtDesc(Long sellerId);

    Page<SellerAuditLog> findAllBySellerIdOrderByCreatedAtDesc(Long sellerId, Pageable pageable);

    Page<SellerAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
