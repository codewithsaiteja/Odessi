package com.odessi.api.service;

import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.*;
import com.odessi.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReferralLifecycleIntegrationTest {

    @Autowired
    private ReferralService referralService;

    @Autowired
    private StoreCreditService storeCreditService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReferralRepository referralRepository;

    @Autowired
    private ReferralCodeRepository referralCodeRepository;

    @Autowired
    private ReferralRewardRepository referralRewardRepository;

    @Autowired
    private ReferralSettingsRepository referralSettingsRepository;

    @Autowired
    private StoreCreditAccountRepository storeCreditAccountRepository;

    @Autowired
    private StoreCreditTransactionRepository storeCreditTransactionRepository;

    @Autowired
    private OrderRepository orderRepository;

    private User userA; // Referrer
    private User userB; // Referee
    private ReferralCode codeA;

    @BeforeEach
    void setUp() {
        // Create User A
        userA = new User("User", "A", "usera.lifecycle@test.com", "hash");
        userRepository.save(userA);

        // Pre-create code for User A
        codeA = referralCodeRepository.save(new ReferralCode(userA, "ODESSI-REF-USERA"));

        // Create User B
        userB = new User("User", "B", "userb.lifecycle@test.com", "hash");
        userRepository.save(userB);

        // Ensure settings are disabled
        ReferralSettings settings = referralSettingsRepository.getSingleton().orElseGet(() -> {
            ReferralSettings s = new ReferralSettings();
            s.setId(1);
            s.setEnabled(false);
            s.setReferrerRewardAmount(BigDecimal.ZERO);
            s.setRewardTrigger("ORDER_DELIVERED");
            return referralSettingsRepository.save(s);
        });
        settings.setEnabled(false);
        settings.setReferrerRewardAmount(BigDecimal.ZERO);
        referralSettingsRepository.save(settings);
    }

    @Test
    @DisplayName("1. Discontinued referral scheme prevents new referral records")
    void discontinuedSchemePreventsNewReferrals() {
        referralService.recordReferral(userB, codeA.getCode());

        Optional<Referral> refOpt = referralRepository.findByRefereeId(userB.getId());
        assertThat(refOpt).isEmpty();
    }

    @Test
    @DisplayName("2. Delivered + captured order does NOT qualify referral or issue credits under discontinued scheme")
    void deliveredAndCapturedOrderDoesNotReward() {
        // Create a pre-existing PENDING referral in DB
        Referral referral = new Referral(userA, userB, codeA.getCode());
        referralRepository.save(referral);

        Order order = new Order();
        order.setOrderNumber("ODR-TEST-DISC-01");
        order.setUser(userB);
        order.setSubtotal(new BigDecimal("1200.00"));
        order.setTotalAmount(new BigDecimal("1200.00"));
        order.setStatus(OrderStatus.DELIVERED);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        orderRepository.save(order);

        // Process qualifying order attempt
        referralService.processQualifyingOrder(userB, order);

        // Status remains PENDING, no qualifying order attached, no reward amount
        Referral unchangedReferral = referralRepository.findByRefereeId(userB.getId()).orElseThrow();
        assertThat(unchangedReferral.getStatus()).isEqualTo(ReferralStatus.PENDING);
        assertThat(unchangedReferral.getQualifyingOrder()).isNull();
        assertThat(unchangedReferral.getRewardAmount()).isNull();

        // NO ReferralReward row created
        assertThat(referralRewardRepository.existsByReferralId(unchangedReferral.getId())).isFalse();

        // User A received NO store credit
        BigDecimal balance = storeCreditService.getAvailableBalance(userA);
        assertThat(balance).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("3. Customer referral response returns programEnabled=false and zero rewards")
    void customerReferralResponseDisabled() {
        ReferralResponse res = referralService.getMyReferralCode(userA);
        assertThat(res.programEnabled()).isFalse();
        assertThat(res.referrerRewardAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(res.refereeRewardAmount()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("4. Existing store credit balances remain completely intact")
    void existingStoreCreditBalancesIntact() {
        // Direct credit via store credit subsystem (e.g., admin adjustment or customer compensation)
        storeCreditService.credit(
            userA,
            new BigDecimal("250.00"),
            StoreCreditTransactionType.ADMIN_ADJUSTMENT,
            StoreCreditReferenceType.ADMIN,
            999L,
            "ADJUST_TEST_1",
            "Customer goodwill compensation"
        );

        BigDecimal balance = storeCreditService.getAvailableBalance(userA);
        assertThat(balance).isEqualByComparingTo("250.00");

        ReferralResponse res = referralService.getMyReferralCode(userA);
        assertThat(res.availableCredit()).isEqualByComparingTo("250.00");
    }
}
