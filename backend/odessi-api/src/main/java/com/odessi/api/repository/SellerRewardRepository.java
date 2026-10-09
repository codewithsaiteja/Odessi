package com.odessi.api.repository;

import com.odessi.api.entity.SellerReward;
import com.odessi.api.entity.SellerRewardStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerRewardRepository extends JpaRepository<SellerReward, Long> {

    List<SellerReward> findAllBySellerIdOrderByTierLevelAsc(Long sellerId);

    Optional<SellerReward> findBySellerIdAndMilestoneConfigId(Long sellerId, Long milestoneConfigId);

    boolean existsBySellerIdAndMilestoneConfigId(Long sellerId, Long milestoneConfigId);

    Page<SellerReward> findAllByStatus(SellerRewardStatus status, Pageable pageable);

    long countByStatus(SellerRewardStatus status);
}
