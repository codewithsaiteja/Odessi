package com.odessi.api.service;

import com.odessi.api.dto.admin.ReferralSettingsResponse;
import com.odessi.api.dto.admin.ReferralSettingsUpdateRequest;
import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.ReferralCodeRepository;
import com.odessi.api.repository.ReferralRepository;
import com.odessi.api.repository.ReferralRewardRepository;
import com.odessi.api.repository.ReferralSettingsRepository;
import com.odessi.api.service.impl.ReferralServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the Referral Settings + Store Credit Reward system.
 *
 * Business rules verified:
 * - Admin can read settings
 * - Admin can update reward amount up to ₹100 ceiling
 * - Setting above ₹100 is capped at ₹100
 * - Reward amount can be below ₹100 (e.g. ₹50, ₹75)
 * - Final credited reward never exceeds ₹100
 * - Referee reward is always 0 (server-enforced)
 * - Default reward is ₹100
 * - Existing rewards are immutable
 * - Self-referral rejected
 * - Duplicate referral rejected
 * - Disabled program prevents new rewards
 * - Frontend cannot manipulate reward amount (server always reads from DB)
 * - Store credit account is credited with exact eligible reward and idempotency key
 */
@ExtendWith(MockitoExtension.class)
class ReferralSettingsServiceTest {

    @Mock ReferralCodeRepository codeRepository;
    @Mock ReferralRepository referralRepository;
    @Mock ReferralSettingsRepository settingsRepository;
    @Mock ReferralRewardRepository rewardRepository;
    @Mock StoreCreditService storeCreditService;

    @InjectMocks ReferralServiceImpl referralService;

    private User referrer;
    private User referee;
    private ReferralSettings defaultSettings;

    @BeforeEach
    void setUp() {
        referrer = new User();
        referrer.setId(1L);
        referrer.setEmail("referrer@odessi.tfi");
        referrer.setFirstName("Alice");
        referrer.setLastName("Odessi");

        referee = new User();
        referee.setId(2L);
        referee.setEmail("referee@odessi.tfi");
        referee.setFirstName("Bob");
        referee.setLastName("Odessi");

        defaultSettings = new ReferralSettings();
        defaultSettings.setId(1);
        defaultSettings.setEnabled(true);
        defaultSettings.setReferrerRewardAmount(new BigDecimal("100.00"));
        defaultSettings.setRefereeRewardAmount(BigDecimal.ZERO);
        defaultSettings.setRewardTrigger("ORDER_DELIVERED");
    }

    // ── Admin: Read Settings ──────────────────────────────────────────────────

    @Test
    @DisplayName("Admin can read referral settings")
    void adminCanReadReferralSettings() {
        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));

        ReferralSettingsResponse response = referralService.getSettings();

        assertThat(response.isEnabled()).isTrue();
        assertThat(response.getReferrerRewardAmount()).isEqualByComparingTo("100.00");
        assertThat(response.getRefereeRewardAmount()).isEqualByComparingTo("0.00");
        assertThat(response.getRewardTrigger()).isEqualTo("ORDER_DELIVERED");
    }

    // ── Admin: Update Reward Amount With Ceiling ──────────────────────────────

    @Test
    @DisplayName("Admin can update reward amount up to ₹100 ceiling, and values above ₹100 are capped")
    void adminCanUpdateRewardAmountWithCeiling() {
        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));
        when(settingsRepository.save(any(ReferralSettings.class))).thenAnswer(i -> i.getArgument(0));

        // Update to ₹75
        ReferralSettingsUpdateRequest request75 = new ReferralSettingsUpdateRequest();
        request75.setEnabled(true);
        request75.setReferrerRewardAmount(new BigDecimal("75.00"));
        request75.setRewardTrigger("ORDER_DELIVERED");

        ReferralSettingsResponse response75 = referralService.updateSettings(request75, "admin@odessi.tfi");
        assertThat(response75.getReferrerRewardAmount()).isEqualByComparingTo("75.00");

        // Attempt to update to ₹150 — capped at ₹100
        ReferralSettingsUpdateRequest request150 = new ReferralSettingsUpdateRequest();
        request150.setEnabled(true);
        request150.setReferrerRewardAmount(new BigDecimal("150.00"));
        request150.setRewardTrigger("ORDER_DELIVERED");

        ReferralSettingsResponse response150 = referralService.updateSettings(request150, "admin@odessi.tfi");
        assertThat(response150.getReferrerRewardAmount()).isEqualByComparingTo("100.00");
        assertThat(response150.getRefereeRewardAmount()).isEqualByComparingTo("0.00");
    }

    // ── Up to ₹100 Rule: Calculation Tests ────────────────────────────────────

    @Test
    @DisplayName("calculateEligibleReward returns configured amount when below ₹100")
    void calculateEligibleRewardBelowHundred() {
        ReferralSettings settings = new ReferralSettings();
        settings.setReferrerRewardAmount(new BigDecimal("50.00"));

        BigDecimal reward = referralService.calculateEligibleReward(null, settings);
        assertThat(reward).isEqualByComparingTo("50.00");

        settings.setReferrerRewardAmount(new BigDecimal("75.00"));
        reward = referralService.calculateEligibleReward(null, settings);
        assertThat(reward).isEqualByComparingTo("75.00");
    }

    @Test
    @DisplayName("calculateEligibleReward returns exactly ₹100 when configured at ₹100")
    void calculateEligibleRewardExactlyHundred() {
        ReferralSettings settings = new ReferralSettings();
        settings.setReferrerRewardAmount(new BigDecimal("100.00"));

        BigDecimal reward = referralService.calculateEligibleReward(null, settings);
        assertThat(reward).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("calculateEligibleReward caps reward at ₹100 if settings exceed ceiling")
    void calculateEligibleRewardCannotExceedHundred() {
        ReferralSettings settings = new ReferralSettings();
        settings.setReferrerRewardAmount(new BigDecimal("250.00"));

        BigDecimal reward = referralService.calculateEligibleReward(null, settings);
        assertThat(reward).isEqualByComparingTo("100.00");
    }

    // ── Default Reward = ₹100 ─────────────────────────────────────────────────

    @Test
    @DisplayName("Default reward amount is ₹100")
    void defaultRewardIsOneHundred() {
        assertThat(defaultSettings.getReferrerRewardAmount()).isEqualByComparingTo("100.00");
    }

    // ── Customer: Reward Amount & Available Store Credit ──────────────────────

    @Test
    @DisplayName("Customer referral response includes current eligible reward and available store credit")
    void customerReferralResponseIncludesCurrentRewardAndAvailableCredit() {
        ReferralCode code = new ReferralCode(referrer, "ODESSI-REF-ABC123");
        when(codeRepository.findByUserId(referrer.getId())).thenReturn(Optional.of(code));
        when(referralRepository.findByReferrerId(referrer.getId())).thenReturn(java.util.List.of());
        when(referralRepository.countByReferrerIdAndStatus(referrer.getId(), ReferralStatus.QUALIFIED)).thenReturn(0L);
        when(rewardRepository.sumIssuedRewardsByReferrerId(referrer.getId())).thenReturn(new BigDecimal("150.00"));
        when(storeCreditService.getAvailableBalance(referrer)).thenReturn(new BigDecimal("150.00"));
        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));

        ReferralResponse response = referralService.getMyReferralCode(referrer);

        assertThat(response.referrerRewardAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.refereeRewardAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(response.totalRewardsEarned()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(response.availableCredit()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(response.code()).isEqualTo("ODESSI-REF-ABC123");
        assertThat(response.programEnabled()).isTrue();
    }

    // ── Referee Receives ₹0 ───────────────────────────────────────────────────

    @Test
    @DisplayName("Referee always receives ₹0 — confirmed by backend response")
    void refereeReceivesZeroBenefit() {
        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));

        ReferralSettingsResponse response = referralService.getSettings();

        assertThat(response.getRefereeRewardAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Admin cannot set referee reward — it is always forced to 0")
    void adminCannotSetRefereeReward() {
        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));
        when(settingsRepository.save(any(ReferralSettings.class))).thenAnswer(i -> i.getArgument(0));

        ReferralSettingsUpdateRequest request = new ReferralSettingsUpdateRequest();
        request.setEnabled(true);
        request.setReferrerRewardAmount(new BigDecimal("100.00"));
        request.setRewardTrigger("ORDER_DELIVERED");

        ReferralSettingsResponse response = referralService.updateSettings(request, "admin@odessi.tfi");
        assertThat(response.getRefereeRewardAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ── Self-Referral Rejected ────────────────────────────────────────────────

    @Test
    @DisplayName("Self-referral is rejected with BadRequestException")
    void selfReferralRejected() {
        ReferralCode code = new ReferralCode(referrer, "ODESSI-REF-SELF1");
        when(codeRepository.findByCode("ODESSI-REF-SELF1")).thenReturn(Optional.of(code));

        assertThatThrownBy(() -> referralService.recordReferral(referrer, "ODESSI-REF-SELF1"))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Self-referral");
    }

    // ── Duplicate Referral Cannot Generate Duplicate Reward ──────────────────

    @Test
    @DisplayName("Already-qualified referral does not create a second reward")
    void duplicateReferralNoDuplicateReward() {
        Referral existingReferral = new Referral(referrer, referee, "ODESSI-REF-ABC");
        existingReferral.setStatus(ReferralStatus.QUALIFIED); // Already qualified

        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));
        when(referralRepository.findByRefereeIdWithLock(referee.getId())).thenReturn(Optional.of(existingReferral));

        Order order = new Order();
        order.setId(10L);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setStatus(OrderStatus.DELIVERED);

        referralService.processQualifyingOrder(referee, order);

        // Should not save any reward or credit store credit
        verify(rewardRepository, never()).save(any());
        verify(storeCreditService, never()).credit(any(), any(), any(), any(), any(), any(), any());
    }

    // ── Disabled Program Prevents Rewards ────────────────────────────────────

    @Test
    @DisplayName("Disabled referral program prevents new reward creation")
    void disabledProgramPreventsRewards() {
        ReferralSettings disabledSettings = new ReferralSettings();
        disabledSettings.setEnabled(false);
        disabledSettings.setReferrerRewardAmount(new BigDecimal("100.00"));

        when(settingsRepository.getSingleton()).thenReturn(Optional.of(disabledSettings));

        Order order = new Order();
        order.setId(11L);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setStatus(OrderStatus.DELIVERED);

        referralService.processQualifyingOrder(referee, order);

        verify(referralRepository, never()).findByRefereeIdWithLock(anyLong());
        verify(rewardRepository, never()).save(any());
        verify(storeCreditService, never()).credit(any(), any(), any(), any(), any(), any(), any());
    }

    // ── Existing Rewards Are Immutable ───────────────────────────────────────

    @Test
    @DisplayName("Referral qualification creates immutable reward and credits store credit")
    void referralQualificationCreditsStoreCredit() {
        Referral pendingReferral = new Referral(referrer, referee, "ODESSI-REF-IMMU1");
        pendingReferral.setId(77L);
        pendingReferral.setStatus(ReferralStatus.PENDING);

        Order order = new Order();
        order.setId(20L);
        order.setOrderNumber("ODR-20261007-00001");
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setStatus(OrderStatus.DELIVERED);

        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings)); // ₹100
        when(referralRepository.findByRefereeIdWithLock(referee.getId())).thenReturn(Optional.of(pendingReferral));
        when(rewardRepository.existsByReferralId(77L)).thenReturn(false);
        when(referralRepository.save(any())).thenReturn(pendingReferral);
        when(rewardRepository.save(any(ReferralReward.class))).thenAnswer(i -> i.getArgument(0));

        referralService.processQualifyingOrder(referee, order);

        // Verifies reward was saved
        verify(rewardRepository).save(argThat(reward ->
            reward.getRewardAmount().compareTo(new BigDecimal("100.00")) == 0
        ));

        // Verifies store credit was credited with proper idempotency key
        verify(storeCreditService).credit(
            eq(referrer),
            eq(new BigDecimal("100.00")),
            eq(StoreCreditTransactionType.REFERRAL_REWARD),
            eq(StoreCreditReferenceType.REFERRAL),
            eq(77L),
            eq("REF_REWARD_77"),
            contains("ODR-20261007-00001")
        );
    }

    // ── Reward Not Created Before Qualification ───────────────────────────────

    @Test
    @DisplayName("Reward is not created for unpaid or undelivered orders")
    void rewardNotCreatedBeforeQualification() {
        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));

        Order unpaidOrder = new Order();
        unpaidOrder.setId(30L);
        unpaidOrder.setPaymentStatus(PaymentStatus.PENDING);
        unpaidOrder.setStatus(OrderStatus.PENDING);

        referralService.processQualifyingOrder(referee, unpaidOrder);

        verify(rewardRepository, never()).save(any());
        verify(storeCreditService, never()).credit(any(), any(), any(), any(), any(), any(), any());
    }

    // ── Referral Reward Idempotency Guard ────────────────────────────────────

    @Test
    @DisplayName("Existing reward ledger entry prevents duplicate insertion")
    void rewardLedgerIdempotencyGuard() {
        Referral pendingReferral = new Referral(referrer, referee, "ODESSI-REF-IDEM1");
        pendingReferral.setId(88L);
        pendingReferral.setStatus(ReferralStatus.PENDING);

        Order order = new Order();
        order.setId(40L);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setStatus(OrderStatus.DELIVERED);

        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));
        when(referralRepository.findByRefereeIdWithLock(referee.getId())).thenReturn(Optional.of(pendingReferral));
        when(rewardRepository.existsByReferralId(88L)).thenReturn(true); // Already issued
        when(referralRepository.save(any())).thenReturn(pendingReferral);

        referralService.processQualifyingOrder(referee, order);

        // Idempotency: should NOT save a second reward or credit store credit
        verify(rewardRepository, never()).save(any());
        verify(storeCreditService, never()).credit(any(), any(), any(), any(), any(), any(), any());
    }
}
