package com.odessi.api.service.impl;

import com.odessi.api.dto.admin.AdminReferralResponse;
import com.odessi.api.dto.admin.ReferralAnalyticsResponse;
import com.odessi.api.dto.admin.ReferralSettingsResponse;
import com.odessi.api.dto.admin.ReferralSettingsUpdateRequest;
import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.*;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
public class ReferralServiceImpl implements ReferralService {

    private static final Logger log = LoggerFactory.getLogger(ReferralServiceImpl.class);

    /**
     * Hard business ceiling: maximum eligible referral reward is ₹100.
     * The reward calculation must never exceed this amount under any configuration.
     */
    public static final BigDecimal MAX_REFERRAL_REWARD_CAP = new BigDecimal("100.00");

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

    // ── Helpers ───────────────────────────────────────────────────────

    /**
     * Retrieves the current settings or returns a safe default (enabled=true, reward=100).
     * This prevents any NPE if the seed row is somehow missing.
     */
    private ReferralSettings getCurrentSettings() {
        return settingsRepository.getSingleton().orElseGet(() -> {
            log.warn("referral_settings seed row missing — returning default settings");
            ReferralSettings defaults = new ReferralSettings();
            defaults.setId(1);
            return defaults;
        });
    }

    /**
     * Calculates the eligible reward amount for a qualifying order, enforcing the
     * business rule ceiling of up to ₹100.
     */
    @Override
    public BigDecimal calculateEligibleReward(Order order, ReferralSettings settings) {
        ReferralSettings effectiveSettings = settings != null ? settings : getCurrentSettings();
        BigDecimal configuredAmount = effectiveSettings.getReferrerRewardAmount();
        if (configuredAmount == null || configuredAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        // Enforce the strict ₹100 maximum eligible reward rule
        return configuredAmount.min(MAX_REFERRAL_REWARD_CAP);
    }

    // ── Customer-facing ───────────────────────────────────────────────

    @Override
    @Transactional
    public ReferralResponse getMyReferralCode(User user) {
        if (user == null || user.getId() == null) {
            throw new BadRequestException("USER_REQUIRED", "Authenticated user required");
        }

        // Get or create the referral code for this user
        ReferralCode refCode = codeRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                String uniqueCode = "ODESSI-REF-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                return codeRepository.save(new ReferralCode(user, uniqueCode));
            });

        long totalCount = referralRepository.findByReferrerId(user.getId()).size();
        long qualifiedCount = referralRepository.countByReferrerIdAndStatus(user.getId(), ReferralStatus.QUALIFIED);

        // Total rewards earned — from the immutable ledger (historical lifetime sum)
        BigDecimal totalEarned = rewardRepository.sumIssuedRewardsByReferrerId(user.getId());

        // Available spendable store credit — from the store credit subsystem
        BigDecimal availableCredit = storeCreditService != null
            ? storeCreditService.getAvailableBalance(user)
            : BigDecimal.ZERO;

        // Current reward amount — from admin-controlled settings (capped at ₹100)
        ReferralSettings settings = getCurrentSettings();
        BigDecimal eligibleReward = calculateEligibleReward(null, settings);

        String shareUrl = "/register?ref=" + refCode.getCode();

        return new ReferralResponse(
            refCode.getCode(),
            shareUrl,
            totalCount,
            qualifiedCount,
            totalEarned,
            availableCredit,
            eligibleReward,
            settings.getRefereeRewardAmount(), // always 0
            settings.isEnabled(),
            refCode.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public void recordReferral(User referee, String rawCode) {
        if (referee == null || rawCode == null || rawCode.isBlank()) return;

        String code = rawCode.trim().toUpperCase();
        Optional<ReferralCode> refCodeOpt = codeRepository.findByCode(code);
        if (refCodeOpt.isEmpty()) {
            log.debug("Referral code not found: {}", code);
            return;
        }

        User referrer = refCodeOpt.get().getUser();

        // SECURITY: Prevent self-referral
        if (referrer.getId().equals(referee.getId())) {
            throw new BadRequestException("INVALID_REFERRAL", "Self-referral is not allowed");
        }

        // IDEMPOTENCY: One referral relationship per referee
        if (referralRepository.findByRefereeId(referee.getId()).isPresent()) {
            log.debug("Referee {} already has a referral relationship — skipping", referee.getId());
            return;
        }

        Referral referral = new Referral(referrer, referee, code);
        referralRepository.save(referral);
        log.info("Referral recorded: referrer={}, referee={}, code={}", referrer.getId(), referee.getId(), code);
    }

    @Override
    @Transactional
    public void processQualifyingOrder(User referee, Order order) {
        if (referee == null || order == null) return;

        ReferralSettings settings = getCurrentSettings();

        // If the program is disabled, skip reward creation
        if (!settings.isEnabled()) {
            log.info("Referral program disabled — skipping reward for referee={}", referee.getId());
            return;
        }

        // Check qualification trigger
        boolean meetsPaymentCondition =
            order.getPaymentStatus() == PaymentStatus.CAPTURED ||
            order.getPaymentStatus() == PaymentStatus.PAID;

        boolean meetsDeliveryCondition =
            "ORDER_DELIVERED".equals(settings.getRewardTrigger())
                ? order.getStatus() == OrderStatus.DELIVERED
                : meetsPaymentCondition;

        if (!meetsPaymentCondition || !meetsDeliveryCondition) {
            log.debug("Order {} does not meet qualification condition — payment={}, status={}",
                order.getId(), order.getPaymentStatus(), order.getStatus());
            return;
        }

        // Check optional minimum order value
        if (settings.getMinimumOrderValue() != null && order.getTotalAmount() != null) {
            if (order.getTotalAmount().compareTo(settings.getMinimumOrderValue()) < 0) {
                log.info("Order {} total {} below minimum {} — referral not qualified",
                    order.getId(), order.getTotalAmount(), settings.getMinimumOrderValue());
                return;
            }
        }

        // Fetch referral with pessimistic lock when available to avoid concurrent race conditions
        Optional<Referral> refOpt = referralRepository.findByRefereeIdWithLock(referee.getId());
        if (refOpt.isEmpty()) {
            refOpt = referralRepository.findByRefereeId(referee.getId());
        }
        if (refOpt.isEmpty()) return;

        Referral referral = refOpt.get();

        // IDEMPOTENCY: Only PENDING referrals can be qualified
        if (referral.getStatus() != ReferralStatus.PENDING) {
            log.debug("Referral {} status is {} (not PENDING) — skipping duplicate reward",
                referral.getId(), referral.getStatus());
            return;
        }

        // Calculate eligible reward with strict ceiling at ₹100
        BigDecimal rewardAmount = calculateEligibleReward(order, settings);

        // Update referral status atomically
        referral.setStatus(ReferralStatus.QUALIFIED);
        referral.setQualifyingOrder(order);
        referral.setRewardAmount(rewardAmount);
        referralRepository.save(referral);

        // IDEMPOTENCY guard on reward ledger
        if (rewardRepository.existsByReferralId(referral.getId())) {
            log.warn("Reward already exists for referral {} — idempotency guard prevented duplicate", referral.getId());
            return;
        }

        // Create immutable reward ledger entry
        ReferralReward reward = new ReferralReward(
            referral,
            referral.getReferrer(),
            referee,
            order,
            referral.getCodeUsed(),
            rewardAmount
        );
        rewardRepository.save(reward);

        // Credit the referrer's store credit account in the ledger
        if (storeCreditService != null) {
            String idempotencyKey = "REF_REWARD_" + referral.getId();
            String description = "Referral reward for referee " + referee.getEmail() + " (Order " + order.getOrderNumber() + ")";
            storeCreditService.credit(
                referral.getReferrer(),
                rewardAmount,
                StoreCreditTransactionType.REFERRAL_REWARD,
                StoreCreditReferenceType.REFERRAL,
                referral.getId(),
                idempotencyKey,
                description
            );
        }

        log.info("Referral reward ISSUED & STORE CREDIT CREDITED: referral={}, referrer={}, amount={}",
            referral.getId(), referral.getReferrer().getId(), rewardAmount);
    }

    // ── Admin-facing ──────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<AdminReferralResponse> getReferralsForAdmin(Pageable pageable) {
        return referralRepository.findAll(pageable).map(AdminReferralResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public ReferralSettingsResponse getSettings() {
        return ReferralSettingsResponse.fromEntity(getCurrentSettings());
    }

    @Override
    @Transactional
    public ReferralSettingsResponse updateSettings(ReferralSettingsUpdateRequest request, String adminEmail) {
        ReferralSettings settings = getCurrentSettings();

        settings.setEnabled(request.getEnabled());

        // Enforce hard ceiling of ₹100 maximum eligible reward
        BigDecimal requestedReward = request.getReferrerRewardAmount();
        if (requestedReward != null && requestedReward.compareTo(MAX_REFERRAL_REWARD_CAP) > 0) {
            log.warn("Admin attempted to set referral reward to {} which exceeds max cap {}. Capping at {}",
                requestedReward, MAX_REFERRAL_REWARD_CAP, MAX_REFERRAL_REWARD_CAP);
            requestedReward = MAX_REFERRAL_REWARD_CAP;
        }
        settings.setReferrerRewardAmount(requestedReward != null ? requestedReward : MAX_REFERRAL_REWARD_CAP);
        settings.setRefereeRewardAmount(BigDecimal.ZERO);
        settings.setMinimumOrderValue(request.getMinimumOrderValue());
        settings.setRewardTrigger(request.getRewardTrigger());
        settings.setUpdatedBy(adminEmail);

        // If the settings row doesn't exist yet, create it
        if (settingsRepository.getSingleton().isEmpty()) {
            settings.setId(1);
        }

        ReferralSettings saved = settingsRepository.save(settings);
        log.info("Referral settings updated by {}: enabled={}, reward={}",
            adminEmail, saved.isEnabled(), saved.getReferrerRewardAmount());

        return ReferralSettingsResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReferralAnalyticsResponse getAnalytics() {
        long totalReferrals = referralRepository.count();
        long successfulReferrals = referralRepository.countByStatus(ReferralStatus.QUALIFIED);
        long pendingReferrals = totalReferrals - successfulReferrals;
        long totalRewardsIssued = rewardRepository.countIssuedRewards();
        BigDecimal totalRewardValue = rewardRepository.sumAllIssuedRewards();

        return new ReferralAnalyticsResponse(
            totalReferrals,
            successfulReferrals,
            pendingReferrals,
            totalRewardsIssued,
            totalRewardValue
        );
    }
}
