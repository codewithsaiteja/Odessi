package com.odessi.api.repository;

import com.odessi.api.entity.SellerMilestoneConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerMilestoneConfigRepository extends JpaRepository<SellerMilestoneConfig, Long> {

    List<SellerMilestoneConfig> findAllByOrderByQualifyingSalesThresholdAsc();

    List<SellerMilestoneConfig> findAllByActiveTrueOrderByQualifyingSalesThresholdAsc();

    Optional<SellerMilestoneConfig> findByTierLevel(int tierLevel);

    Optional<SellerMilestoneConfig> findByQualifyingSalesThreshold(int threshold);

    boolean existsByTierLevel(int tierLevel);

    boolean existsByQualifyingSalesThreshold(int threshold);
}
