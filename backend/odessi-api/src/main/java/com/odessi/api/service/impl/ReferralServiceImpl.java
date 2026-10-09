package com.odessi.api.service.impl;

import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.ReferralSettings;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.ReferralCodeRepository;
import com.odessi.api.repository.ReferralRepository;
import com.odessi.api.repository.ReferralRewardRepository;
import com.odessi.api.repository.ReferralSettingsRepository;
import com.odessi.api.service.ReferralService;
import com.odessi.api.service.StoreCreditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class ReferralServiceImpl implements ReferralService {

    private static final Logger log = LoggerFactory.getLogger(ReferralServiceImpl.class);

    private final ReferralCodeRepository codeRepository;
    private final ReferralRepository referralRepository;
    private final ReferralSettingsRepository settingsRepository;
    private final ReferralRewardRepository rewardRepository;
    private final StoreCreditService storeCreditService;

    @Autowired
    public ReferralServiceImpl(
            ReferralCodeRepository codeRepository,
            ReferralRepository referralRepository,
            ReferralSettingsRepository settingsRepository,
            ReferralRewardRepository rewardRepository,
            @Autowired(required = false) StoreCreditService storeCreditService) {
        this.codeRepository = codeRepository;
        this.referralRepository = referralRepository;
        this.settingsRepository = settingsRepository;
        this.rewardRepository = rewardRepository;
        this.storeCreditService = storeCreditService;
    }

    public ReferralServiceImpl(
            ReferralCodeRepository codeRepository,
            ReferralRepository referralRepository,
            ReferralSettingsRepository settingsRepository,
            ReferralRewardRepository rewardRepository) {
        this(codeRepository, referralRepository, settingsRepository, rewardRepository, null);
    }

    /**
     * Calculates the eligible reward amount for a qualifying order.
     * Note: The customer Referral & Rewards scheme is discontinued; eligible reward is always zero.
     */
    @Override
    public BigDecimal calculateEligibleReward(Order order, ReferralSettings settings) {
        return BigDecimal.ZERO;
    }

    /**
     * Returns the customer's referral response with program permanently disabled (enabled=false, 0 rewards),
     * while preserving historical financial records (lifetime rewards earned) and available spendable store credit.
     */
    @Override
    @Transactional(readOnly = true)
    public ReferralResponse getMyReferralCode(User user) {
        if (user == null || user.getId() == null) {
            throw new BadRequestException("USER_REQUIRED", "Authenticated user required");
        }

        // Total rewards earned from the immutable ledger (historical lifetime sum)
        BigDecimal totalEarned = rewardRepository.sumIssuedRewardsByReferrerId(user.getId());

        // Available spendable store credit from the store credit subsystem
        BigDecimal availableCredit = storeCreditService != null
            ? storeCreditService.getAvailableBalance(user)
            : BigDecimal.ZERO;

        return new ReferralResponse(
            "",
            "",
            0,
            0,
            totalEarned != null ? totalEarned : BigDecimal.ZERO,
            availableCredit != null ? availableCredit : BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            false,
            null
        );
    }

    /**
     * Records a new referral relationship.
     * Note: Customer referral scheme is discontinued; no new relationships are recorded.
     */
    @Override
    @Transactional
    public void recordReferral(User referee, String rawCode) {
        if (referee != null && rawCode != null && !rawCode.isBlank()) {
            log.info("Customer referral scheme is discontinued — skipping registration referral code '{}' for referee={}",
                rawCode, referee.getId());
        }
    }

    /**
     * Processes qualifying order for referral rewards.
     * Note: Customer referral reward scheme is discontinued.
     * Strictly prevents issuance of any new ₹100 customer referral credits.
     */
    @Override
    @Transactional
    public void processQualifyingOrder(User referee, Order order) {
        log.info("Customer referral reward scheme is discontinued — skipping reward issuance for referee={}",
            referee != null ? referee.getId() : null);
    }
}
