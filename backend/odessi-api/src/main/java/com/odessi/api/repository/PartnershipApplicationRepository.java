package com.odessi.api.repository;

import com.odessi.api.entity.PartnershipApplication;
import com.odessi.api.entity.PartnershipStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnershipApplicationRepository extends JpaRepository<PartnershipApplication, Long>, JpaSpecificationExecutor<PartnershipApplication> {
    Page<PartnershipApplication> findByStatus(PartnershipStatus status, Pageable pageable);
    long countByStatus(PartnershipStatus status);
}
