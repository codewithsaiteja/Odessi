package com.odessi.api.service;

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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests verifying that the customer Referral & Rewards scheme is discontinued:
 * - Eligible reward is strictly zero (no ₹100 credits can be issued).
 * - processQualifyingOrder never issues rewards or store credit.
 * - recordReferral is a no-op (no new customer referrals recorded).
 * - Customer referral response returns programEnabled=false and zero reward amounts.
 * - Existing customer balances and store credit subsystem remain intact.
 * - Historical financial records and lifetime rewards ledger are preserved.
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
    }

    @Test
    @DisplayName("calculateEligibleReward always returns zero under discontinued scheme")
    void calculateEligibleRewardAlwaysReturnsZero() {
        Order order = new Order();
        order.setTotalAmount(new BigDecimal("2500.00"));

        ReferralSettings settings = new ReferralSettings();
        settings.setEnabled(false);
        settings.setReferrerRewardAmount(BigDecimal.ZERO);

        BigDecimal eligible = referralService.calculateEligibleReward(order, settings);
        assertThat(eligible).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("processQualifyingOrder does not create reward and never credits store credit")
    void processQualifyingOrderDoesNotIssueRewardOrCredit() {
        Order order = new Order();
        order.setId(10L);
        order.setOrderNumber("ODR-DISC-01");
        order.setUser(referee);
        order.setStatus(OrderStatus.DELIVERED);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setTotalAmount(new BigDecimal("1500.00"));

        referralService.processQualifyingOrder(referee, order);

        // Verify no DB modifications or store credit transactions occurred
        verify(rewardRepository, never()).save(any());
        verify(referralRepository, never()).save(any());
        verify(storeCreditService, never()).credit(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("recordReferral does not create new referral relationships")
    void recordReferralDoesNotCreateReferral() {
        referralService.recordReferral(referee, "ODESSI-REF-OLD1");

        verify(referralRepository, never()).save(any());
    }

    @Test
    @DisplayName("getMyReferralCode reports programEnabled=false with zero reward amounts")
    void getMyReferralCodeReportsDisabledProgram() {
        when(rewardRepository.sumIssuedRewardsByReferrerId(1L)).thenReturn(new BigDecimal("200.00"));
        when(storeCreditService.getAvailableBalance(referrer)).thenReturn(new BigDecimal("150.00"));

        ReferralResponse res = referralService.getMyReferralCode(referrer);

        assertThat(res.programEnabled()).isFalse();
        assertThat(res.referrerRewardAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(res.refereeRewardAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        // Preserves historical lifetime earnings and spendable balance
        assertThat(res.totalRewardsEarned()).isEqualByComparingTo("200.00");
        assertThat(res.availableCredit()).isEqualByComparingTo("150.00");
    }

    @Test
    @DisplayName("getMyReferralCode throws BadRequestException when user is null or unpersisted")
    void getMyReferralCodeRequiresUser() {
        assertThatThrownBy(() -> referralService.getMyReferralCode(null))
            .isInstanceOf(BadRequestException.class);

        User emptyUser = new User();
        assertThatThrownBy(() -> referralService.getMyReferralCode(emptyUser))
            .isInstanceOf(BadRequestException.class);
    }
}
