package com.odessi.api.repository;

import com.odessi.api.entity.CustomOrderInquiry;
import com.odessi.api.entity.CustomOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomOrderInquiryRepository extends JpaRepository<CustomOrderInquiry, Long>, JpaSpecificationExecutor<CustomOrderInquiry> {
    Page<CustomOrderInquiry> findByStatus(CustomOrderStatus status, Pageable pageable);
    long countByStatus(CustomOrderStatus status);
}
