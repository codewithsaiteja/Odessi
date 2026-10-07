package com.odessi.api.service;

import com.odessi.api.dto.request.RegisterRequest;
import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
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

        // Generate code for User A
        ReferralResponse refResponse = referralService.getMyReferralCode(userA);
        codeA = referralCodeRepository.findByCode(refResponse.code()).orElseThrow();

        // Create User B
        userB = new User("User", "B", "userb.lifecycle@test.com", "hash");
        userRepository.save(userB);

        // Ensure settings are seeded
        ReferralSettings settings = referralSettingsRepository.getSingleton().orElseGet(() -> {
            ReferralSettings s = new ReferralSettings();
            s.setId(1);
            s.setEnabled(true);
            s.setReferrerRewardAmount(new BigDecimal("100.00"));
            s.setRewardTrigger("ORDER_DELIVERED");
            return referralSettingsRepository.save(s);
        });
        settings.setEnabled(true);
        settings.setReferrerRewardAmount(new BigDecimal("100.00"));
        settings.setRewardTrigger("ORDER_DELIVERED");
        referralSettingsRepository.save(settings);
    }

    @Test
    @DisplayName("1. Referral registration creates PENDING referral linking referrer and referee")
    void referralRegistrationCreatesPending() {
        referralService.recordReferral(userB, codeA.getCode());

        Optional<Referral> refOpt = referralRepository.findByRefereeId(userB.getId());
        assertThat(refOpt).isPresent();
        Referral referral = refOpt.get();
        assertThat(referral.getReferrer().getId()).isEqualTo(userA.getId());
        assertThat(referral.getReferee().getId()).isEqualTo(userB.getId());
        assertThat(referral.getCodeUsed()).isEqualTo(codeA.getCode());
        assertThat(referral.getStatus()).isEqualTo(ReferralStatus.PENDING);
        assertThat(referral.getQualifyingOrder()).isNull();
    }

    @Test
    @DisplayName("2. Self-referral is rejected")
    void selfReferralRejected() {
        assertThatThrownBy(() -> referralService.recordReferral(userA, codeA.getCode()))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Self-referral");
    }

    @Test
    @DisplayName("3. Referral remains PENDING when order is only created or payment failed")
    void paymentFailureDoesNotReward() {
        referralService.recordReferral(userB, codeA.getCode());

        Order order = new Order();
        order.setOrderNumber("ODR-TEST-FAIL-01");
        order.setUser(userB);
        order.setSubtotal(new BigDecimal("1200.00"));
        order.setTotalAmount(new BigDecimal("1200.00"));
        order.setStatus(OrderStatus.PAYMENT_FAILED);
        order.setPaymentStatus(PaymentStatus.FAILED);
        orderRepository.save(order);

        referralService.processQualifyingOrder(userB, order);

        Referral referral = referralRepository.findByRefereeId(userB.getId()).orElseThrow();
        assertThat(referral.getStatus()).isEqualTo(ReferralStatus.PENDING);
        assertThat(referralRewardRepository.existsByReferralId(referral.getId())).isFalse();
        assertThat(storeCreditService.getAvailableBalance(userA)).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("4. Cancelled order does not reward and referral remains PENDING")
    void cancelledOrderDoesNotReward() {
        referralService.recordReferral(userB, codeA.getCode());

        Order order = new Order();
        order.setOrderNumber("ODR-TEST-CANCEL-01");
        order.setUser(userB);
        order.setSubtotal(new BigDecimal("1200.00"));
        order.setTotalAmount(new BigDecimal("1200.00"));
        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        orderRepository.save(order);

        referralService.processQualifyingOrder(userB, order);

        Referral referral = referralRepository.findByRefereeId(userB.getId()).orElseThrow();
        assertThat(referral.getStatus()).isEqualTo(ReferralStatus.PENDING);
        assertThat(referralRewardRepository.existsByReferralId(referral.getId())).isFalse();
        assertThat(storeCreditService.getAvailableBalance(userA)).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("5. Delivered + captured order qualifies referral and credits store credit")
    void deliveredAndCapturedOrderQualifiesAndCredits() {
        referralService.recordReferral(userB, codeA.getCode());

        Order order = new Order();
        order.setOrderNumber("ODR-TEST-DELIV-01");
        order.setUser(userB);
        order.setSubtotal(new BigDecimal("1200.00"));
        order.setTotalAmount(new BigDecimal("1200.00"));
        order.setStatus(OrderStatus.DELIVERED);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        orderRepository.save(order);

        referralService.processQualifyingOrder(userB, order);

        // Referral status = QUALIFIED
        Referral referral = referralRepository.findByRefereeId(userB.getId()).orElseThrow();
        assertThat(referral.getStatus()).isEqualTo(ReferralStatus.QUALIFIED);
        assertThat(referral.getQualifyingOrder().getId()).isEqualTo(order.getId());
        assertThat(referral.getRewardAmount()).isEqualByComparingTo("100.00");

        // ReferralReward record exists
        Optional<ReferralReward> rewardOpt = referralRewardRepository.findByReferralId(referral.getId());
        assertThat(rewardOpt).isPresent();
        ReferralReward reward = rewardOpt.get();
        assertThat(reward.getRewardAmount()).isEqualByComparingTo("100.00");
        assertThat(reward.getStatus()).isEqualTo("ISSUED");

        // Store credit credited to User A
        BigDecimal availableBalance = storeCreditService.getAvailableBalance(userA);
        assertThat(availableBalance).isEqualByComparingTo("100.00");

        StoreCreditAccount account = storeCreditAccountRepository.findByUserId(userA.getId()).orElseThrow();
        assertThat(account.getAvailableBalance()).isEqualByComparingTo("100.00");
        assertThat(account.getLifetimeCredited()).isEqualByComparingTo("100.00");

        // StoreCreditTransaction ledger check
        String idempotencyKey = "REF_REWARD_" + referral.getId();
        Optional<StoreCreditTransaction> txOpt = storeCreditTransactionRepository.findByIdempotencyKey(idempotencyKey);
        assertThat(txOpt).isPresent();
        StoreCreditTransaction tx = txOpt.get();
        assertThat(tx.getAmount()).isEqualByComparingTo("100.00");
        assertThat(tx.getBalanceAfter()).isEqualByComparingTo("100.00");
        assertThat(tx.getTransactionType()).isEqualTo(StoreCreditTransactionType.REFERRAL_REWARD);
        assertThat(tx.getReferenceType()).isEqualTo(StoreCreditReferenceType.REFERRAL);
        assertThat(tx.getReferenceId()).isEqualTo(referral.getId());
    }

    @Test
    @DisplayName("6. Variable reward amount below ₹100 (e.g. ₹75) credits exactly ₹75")
    void variableRewardBelowHundredCreditsExactAmount() {
        ReferralSettings settings = referralSettingsRepository.getSingleton().orElseThrow();
        settings.setReferrerRewardAmount(new BigDecimal("75.00"));
        referralSettingsRepository.save(settings);

        referralService.recordReferral(userB, codeA.getCode());

        Order order = new Order();
        order.setOrderNumber("ODR-TEST-75-01");
        order.setUser(userB);
        order.setSubtotal(new BigDecimal("1200.00"));
        order.setTotalAmount(new BigDecimal("1200.00"));
        order.setStatus(OrderStatus.DELIVERED);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        orderRepository.save(order);

        referralService.processQualifyingOrder(userB, order);

        Referral referral = referralRepository.findByRefereeId(userB.getId()).orElseThrow();
        assertThat(referral.getRewardAmount()).isEqualByComparingTo("75.00");

        BigDecimal balance = storeCreditService.getAvailableBalance(userA);
        assertThat(balance).isEqualByComparingTo("75.00");
    }

    @Test
    @DisplayName("7. Duplicate qualification attempts are strictly idempotent and do not double-credit")
    void duplicateQualificationIsIdempotent() {
        referralService.recordReferral(userB, codeA.getCode());

        Order order = new Order();
        order.setOrderNumber("ODR-TEST-DUP-01");
        order.setUser(userB);
        order.setSubtotal(new BigDecimal("1200.00"));
        order.setTotalAmount(new BigDecimal("1200.00"));
        order.setStatus(OrderStatus.DELIVERED);
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        orderRepository.save(order);

        // First attempt: succeeds
        referralService.processQualifyingOrder(userB, order);

        BigDecimal balanceFirst = storeCreditService.getAvailableBalance(userA);
        assertThat(balanceFirst).isEqualByComparingTo("100.00");

        // Second attempt: must be safely ignored
        referralService.processQualifyingOrder(userB, order);

        BigDecimal balanceSecond = storeCreditService.getAvailableBalance(userA);
        assertThat(balanceSecond).isEqualByComparingTo("100.00");

        // Third attempt with another order on same referee: also safely ignored
        Order order2 = new Order();
        order2.setOrderNumber("ODR-TEST-DUP-02");
        order2.setUser(userB);
        order2.setSubtotal(new BigDecimal("1500.00"));
        order2.setTotalAmount(new BigDecimal("1500.00"));
        order2.setStatus(OrderStatus.DELIVERED);
        order2.setPaymentStatus(PaymentStatus.CAPTURED);
        orderRepository.save(order2);

        referralService.processQualifyingOrder(userB, order2);

        BigDecimal balanceThird = storeCreditService.getAvailableBalance(userA);
        assertThat(balanceThird).isEqualByComparingTo("100.00");
    }
}
