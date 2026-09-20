package com.odessi.api.repository;

import com.odessi.api.entity.Referral;
import com.odessi.api.entity.ReferralStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReferralRepository extends JpaRepository<Referral, Long> {
    Optional<Referral> findByRefereeId(Long refereeId);
    List<Referral> findByReferrerId(Long referrerId);
    Page<Referral> findByReferrerId(Long referrerId, Pageable pageable);
    long countByReferrerIdAndStatus(Long referrerId, ReferralStatus status);
}
