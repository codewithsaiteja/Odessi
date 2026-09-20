package com.odessi.api.repository;

import com.odessi.api.entity.ReferralCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReferralCodeRepository extends JpaRepository<ReferralCode, Long> {
    Optional<ReferralCode> findByUserId(Long userId);
    Optional<ReferralCode> findByCode(String code);
    boolean existsByCode(String code);
}
