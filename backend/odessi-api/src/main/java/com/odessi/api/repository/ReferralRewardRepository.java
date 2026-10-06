package com.odessi.api.repository;

import com.odessi.api.entity.ReferralReward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReferralRewardRepository extends JpaRepository<ReferralReward, Long> {

    /** Check if a reward already exists for a given referral (idempotency guard). */
    boolean existsByReferralId(Long referralId);

    /** Find all rewards for a referrer (to display total earned). */
    List<ReferralReward> findByReferrerId(Long referrerId);

    /** Sum of all issued rewards for a referrer. */
    @Query("SELECT COALESCE(SUM(r.rewardAmount), 0) FROM ReferralReward r WHERE r.referrer.id = :referrerId AND r.status = 'ISSUED'")
    BigDecimal sumIssuedRewardsByReferrerId(Long referrerId);

    /** Total rewards issued platform-wide (for admin analytics). */
    @Query("SELECT COUNT(r) FROM ReferralReward r WHERE r.status = 'ISSUED'")
    long countIssuedRewards();

    /** Total reward value issued platform-wide. */
    @Query("SELECT COALESCE(SUM(r.rewardAmount), 0) FROM ReferralReward r WHERE r.status = 'ISSUED'")
    BigDecimal sumAllIssuedRewards();

    /** Find the reward for a specific referral (for deduplication). */
    Optional<ReferralReward> findByReferralId(Long referralId);
}
