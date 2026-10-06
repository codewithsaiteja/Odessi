package com.odessi.api.service.impl;

import com.odessi.api.dto.admin.AdminReferralResponse;
import com.odessi.api.dto.admin.ReferralAnalyticsResponse;
import com.odessi.api.dto.admin.ReferralSettingsResponse;
import com.odessi.api.dto.admin.ReferralSettingsUpdateRequest;
import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderStatus;
import com.odessi.api.entity.PaymentStatus;
import com.odessi.api.entity.Referral;
import com.odessi.api.entity.ReferralCode;
import com.odessi.api.entity.ReferralReward;
import com.odessi.api.entity.ReferralSettings;
import com.odessi.api.entity.ReferralStatus;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.ReferralCodeRepository;
import com.odessi.api.repository.ReferralRepository;
import com.odessi.api.repository.ReferralRewardRepository;
import com.odessi.api.repository.ReferralSettingsRepository;
import com.odessi.api.service.ReferralService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private final ReferralCodeRepository codeRepository;
    private final ReferralRepository referralRepository;
    private final ReferralSettingsRepository settingsRepository;
    private final ReferralRewardRepository rewardRepository;

    public ReferralServiceImpl(
            ReferralCodeRepository codeRepository,
            ReferralRepository referralRepository,
            ReferralSettingsRepository settingsRepository,
            ReferralRewardRepository rewardRepository) {
        this.codeRepository = codeRepository;
        this.referralRepository = referralRepository;
        this.settingsRepository = settingsRepository;
        this.rewardRepository = rewardRepository;
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

        // Total rewards earned — from the immutable ledger (not recalculated from current settings)
        BigDecimal totalEarned = rewardRepository.sumIssuedRewardsByReferrerId(user.getId());

        // Current reward amount — from admin-controlled settings
        ReferralSettings settings = getCurrentSettings();

        String shareUrl = "/register?ref=" + refCode.getCode();

        return new ReferralResponse(
            refCode.getCode(),
            shareUrl,
            totalCount,
            qualifiedCount,
            totalEarned,
            settings.getReferrerRewardAmount(),   // dynamic — from DB
            settings.getRefereeRewardAmount(),     // always 0
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

        Optional<Referral> refOpt = referralRepository.findByRefereeId(referee.getId());
        if (refOpt.isEmpty()) return;

        Referral referral = refOpt.get();

        // IDEMPOTENCY: Already qualified — do not double-reward
        if (referral.getStatus() == ReferralStatus.QUALIFIED) {
            log.debug("Referral {} already QUALIFIED — skipping duplicate reward", referral.getId());
            return;
        }

        // Snapshot the CURRENT reward amount from settings
        // This value is stored immutably in the reward ledger
        BigDecimal rewardAmount = settings.getReferrerRewardAmount();

        // Update referral status
        referral.setStatus(ReferralStatus.QUALIFIED);
        referral.setQualifyingOrder(order);
        referralRepository.save(referral);

        // IDEMPOTENCY guard on reward ledger
        if (rewardRepository.existsByReferralId(referral.getId())) {
            log.warn("Reward already exists for referral {} — idempotency guard prevented duplicate", referral.getId());
            return;
        }

        // Create immutable reward ledger entry
        // The rewardAmount is NEVER recalculated — it is locked at this value forever
        ReferralReward reward = new ReferralReward(
            referral,
            referral.getReferrer(),
            referee,
            order,
            referral.getCodeUsed(),
            rewardAmount
        );
        rewardRepository.save(reward);

        log.info("Referral reward ISSUED: referral={}, referrer={}, amount={}",
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

        // SECURITY: referee reward always stays at 0 — never updated from any request
        settings.setEnabled(request.getEnabled());
        settings.setReferrerRewardAmount(request.getReferrerRewardAmount());
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
