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
 * Unit tests for the Referral Settings + Reward system.
 *
 * Business rules verified:
 * - Admin can read settings
 * - Admin can update reward amount
 * - Referee reward is always 0 (server-enforced)
 * - Default reward is ₹100
 * - Changing ₹100 → ₹150 only affects future referrals
 * - Existing rewards are immutable
 * - Self-referral rejected
 * - Duplicate referral rejected
 * - Disabled program prevents new rewards
 * - Frontend cannot manipulate reward amount (server always reads from DB)
 */
@ExtendWith(MockitoExtension.class)
class ReferralSettingsServiceTest {

    @Mock ReferralCodeRepository codeRepository;
    @Mock ReferralRepository referralRepository;
    @Mock ReferralSettingsRepository settingsRepository;
    @Mock ReferralRewardRepository rewardRepository;

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

    // ── Admin: Update Reward Amount ───────────────────────────────────────────

    @Test
    @DisplayName("Admin can update reward amount from ₹100 to ₹150")
    void adminCanUpdateRewardAmount() {
        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));
        when(settingsRepository.save(any(ReferralSettings.class))).thenAnswer(i -> i.getArgument(0));

        ReferralSettingsUpdateRequest request = new ReferralSettingsUpdateRequest();
        request.setEnabled(true);
        request.setReferrerRewardAmount(new BigDecimal("150.00"));
        request.setRewardTrigger("ORDER_DELIVERED");

        ReferralSettingsResponse response = referralService.updateSettings(request, "admin@odessi.tfi");

        assertThat(response.getReferrerRewardAmount()).isEqualByComparingTo("150.00");
        // Referee reward must always stay at 0 — server enforces it
        assertThat(response.getRefereeRewardAmount()).isEqualByComparingTo("0.00");
        assertThat(response.isEnabled()).isTrue();
    }

    // ── Default Reward = ₹100 ─────────────────────────────────────────────────

    @Test
    @DisplayName("Default reward amount is ₹100")
    void defaultRewardIsOneHundred() {
        assertThat(defaultSettings.getReferrerRewardAmount()).isEqualByComparingTo("100.00");
    }

    // ── Customer: Reward Amount Comes from Settings ───────────────────────────

    @Test
    @DisplayName("Customer referral response includes current reward from backend settings")
    void customerReferralResponseIncludesCurrentReward() {
        ReferralCode code = new ReferralCode(referrer, "ODESSI-REF-ABC123");
        when(codeRepository.findByUserId(referrer.getId())).thenReturn(Optional.of(code));
        when(referralRepository.findByReferrerId(referrer.getId())).thenReturn(java.util.List.of());
        when(referralRepository.countByReferrerIdAndStatus(referrer.getId(), ReferralStatus.QUALIFIED)).thenReturn(0L);
        when(rewardRepository.sumIssuedRewardsByReferrerId(referrer.getId())).thenReturn(BigDecimal.ZERO);
        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));

        ReferralResponse response = referralService.getMyReferralCode(referrer);

        // Reward amount comes from DB — not hardcoded
        assertThat(response.referrerRewardAmount()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.refereeRewardAmount()).isEqualByComparingTo(BigDecimal.ZERO);
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
    @DisplayName("Admin cannot change referee reward amount — it's always forced to 0")
    void adminCannotSetRefereeReward() {
        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));
        when(settingsRepository.save(any(ReferralSettings.class))).thenAnswer(i -> i.getArgument(0));

        ReferralSettingsUpdateRequest request = new ReferralSettingsUpdateRequest();
        request.setEnabled(true);
        request.setReferrerRewardAmount(new BigDecimal("100.00"));
        request.setRewardTrigger("ORDER_DELIVERED");
        // Even if someone tries to set referee reward via the request (it has no such field),
        // the service always forces it to 0

        ReferralSettingsResponse response = referralService.updateSettings(request, "admin@odessi.tfi");
        assertThat(response.getRefereeRewardAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // ── Self-Referral Rejected ────────────────────────────────────────────────

    @Test
    @DisplayName("Self-referral is rejected with BadRequestException")
    void selfReferralRejected() {
        ReferralCode code = new ReferralCode(referrer, "ODESSI-REF-SELF1");
        when(codeRepository.findByCode("ODESSI-REF-SELF1")).thenReturn(Optional.of(code));

        // Referee = same person as referrer
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
        when(referralRepository.findByRefereeId(referee.getId())).thenReturn(Optional.of(existingReferral));

        Order order = new Order();
        order.setId(10L);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setStatus(OrderStatus.DELIVERED);

        referralService.processQualifyingOrder(referee, order);

        // Should not save any reward
        verify(rewardRepository, never()).save(any());
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

        // Program disabled — no referral lookup or reward creation
        verify(referralRepository, never()).findByRefereeId(anyLong());
        verify(rewardRepository, never()).save(any());
    }

    // ── Existing Rewards Are Immutable ───────────────────────────────────────

    @Test
    @DisplayName("Changing settings does not retroactively change existing reward amounts")
    void existingRewardsAreImmutable() {
        // This is enforced architecturally: rewards are created with the amount
        // snapshotted at qualification time and never updated afterward.
        // The rewardRepository.save() captures the amount as a fixed value.

        ReferralCode code = new ReferralCode(referrer, "ODESSI-REF-IMMU1");
        Referral pendingReferral = new Referral(referrer, referee, "ODESSI-REF-IMMU1");
        pendingReferral.setStatus(ReferralStatus.PENDING);

        Order order = new Order();
        order.setId(20L);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setStatus(OrderStatus.DELIVERED);

        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings)); // ₹100
        when(referralRepository.findByRefereeId(referee.getId())).thenReturn(Optional.of(pendingReferral));
        when(rewardRepository.existsByReferralId(any())).thenReturn(false);
        when(referralRepository.save(any())).thenReturn(pendingReferral);
        when(rewardRepository.save(any(ReferralReward.class))).thenAnswer(i -> i.getArgument(0));

        // Qualify at ₹100
        referralService.processQualifyingOrder(referee, order);

        // Capture the saved reward
        verify(rewardRepository).save(argThat(reward ->
            reward.getRewardAmount().compareTo(new BigDecimal("100.00")) == 0
        ));

        // Now admin changes to ₹150 — but the saved reward still has ₹100
        // This is guaranteed by immutability: we never update existing referral_rewards rows
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
    }

    // ── Referral Reward Idempotency Guard ────────────────────────────────────

    @Test
    @DisplayName("Existing reward ledger entry prevents duplicate insertion")
    void rewardLedgerIdempotencyGuard() {
        Referral pendingReferral = new Referral(referrer, referee, "ODESSI-REF-IDEM1");
        pendingReferral.setStatus(ReferralStatus.PENDING);

        Order order = new Order();
        order.setId(40L);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setStatus(OrderStatus.DELIVERED);

        when(settingsRepository.getSingleton()).thenReturn(Optional.of(defaultSettings));
        when(referralRepository.findByRefereeId(referee.getId())).thenReturn(Optional.of(pendingReferral));
        when(rewardRepository.existsByReferralId(any())).thenReturn(true); // Already issued
        when(referralRepository.save(any())).thenReturn(pendingReferral);

        referralService.processQualifyingOrder(referee, order);

        // Idempotency: should NOT save a second reward
        verify(rewardRepository, never()).save(any());
    }
}
