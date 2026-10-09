package com.odessi.api.service;

import com.odessi.api.dto.request.*;
import com.odessi.api.dto.response.*;
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
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TrustedSellerProgramIntegrationTest {

    @Autowired private SellerService sellerService;
    @Autowired private AdminSellerService adminSellerService;
    @Autowired private SellerAttributionService attributionService;
    @Autowired private SellerMilestoneService milestoneService;

    @Autowired private UserRepository userRepository;
    @Autowired private SellerRepository sellerRepository;
    @Autowired private SellerAttributionRepository attributionRepository;
    @Autowired private SellerRewardRepository rewardRepository;
    @Autowired private SellerMilestoneConfigRepository milestoneRepository;
    @Autowired private OrderRepository orderRepository;

    private User adminUser;
    private User sellerUser;
    private User customerUser;

    @BeforeEach
    void setup() {
        adminUser = new User();
        adminUser.setEmail("admin-test-" + System.nanoTime() + "@odessi.test");
        adminUser.setPasswordHash("hashedpw");
        adminUser.setFirstName("Admin");
        adminUser.setLastName("User");
        adminUser.setRole(Role.ADMIN);
        adminUser = userRepository.save(adminUser);

        sellerUser = new User();
        sellerUser.setEmail("seller-test-" + System.nanoTime() + "@odessi.test");
        sellerUser.setPasswordHash("hashedpw");
        sellerUser.setFirstName("Jane");
        sellerUser.setLastName("Seller");
        sellerUser.setRole(Role.CUSTOMER);
        sellerUser = userRepository.save(sellerUser);

        customerUser = new User();
        customerUser.setEmail("buyer-test-" + System.nanoTime() + "@odessi.test");
        customerUser.setPasswordHash("hashedpw");
        customerUser.setFirstName("Bob");
        customerUser.setLastName("Buyer");
        customerUser.setRole(Role.CUSTOMER);
        customerUser = userRepository.save(customerUser);
    }

    private Order createTestOrder(User user, BigDecimal amount, OrderStatus status, PaymentStatus paymentStatus) {
        Order order = new Order();
        order.setUser(user);
        order.setOrderNumber("ODR-TEST-" + System.nanoTime());
        order.setSubtotal(amount);
        order.setTotalAmount(amount);
        order.setCurrency("INR");
        order.setStatus(status);
        order.setPaymentStatus(paymentStatus);
        order.setShippingAddressSnapshot("{}");
        return orderRepository.save(order);
    }

    @Test
    @DisplayName("1. Seller Application, Approval, and Access Control")
    void testSellerApplicationAndApproval() {
        // 1a. User applies
        SellerApplyRequest applyReq = new SellerApplyRequest(
            "Jane Seller", sellerUser.getEmail(), "9876543210",
            "@janeseller", "Fashion creator looking to promote luxury streetwear", true
        );
        SellerResponse app = sellerService.applyForSeller(sellerUser, applyReq);

        assertNotNull(app.id());
        assertEquals(SellerStatus.PENDING, app.status());
        assertTrue(app.sellerCode().startsWith("OD-"));

        // 1b. Pending seller cannot access dashboard
        assertThatThrownBy(() -> sellerService.getSellerDashboard(sellerUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Access restricted");

        // 1c. Duplicate application while PENDING is rejected
        assertThatThrownBy(() -> sellerService.applyForSeller(sellerUser, applyReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already have an application awaiting");

        // 1d. Admin approves application
        SellerResponse approved = adminSellerService.updateSellerStatus(adminUser, app.id(), SellerStatus.APPROVED, null);
        assertEquals(SellerStatus.APPROVED, approved.status());

        // 1e. Approved seller can access dashboard
        SellerDashboardResponse dash = sellerService.getSellerDashboard(sellerUser);
        assertNotNull(dash);
        assertEquals(0, dash.verifiedSales());
        assertEquals("Rising Seller", dash.nextMilestone().milestoneName());
        assertEquals(10, dash.remainingSalesToNextMilestone());
        assertTrue(dash.shareableLink().contains(approved.sellerCode()));

        // 1f. Admin suspends seller -> dashboard access blocked
        adminSellerService.updateSellerStatus(adminUser, app.id(), SellerStatus.SUSPENDED, "Suspicious activity");
        assertThatThrownBy(() -> sellerService.getSellerDashboard(sellerUser))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Access restricted");
    }

    @Test
    @DisplayName("2. Seller Rejection and Reapplication")
    void testSellerRejectionAndReapply() {
        SellerApplyRequest applyReq = new SellerApplyRequest(
            "Jane Seller", sellerUser.getEmail(), "9876543210",
            "@janeseller", "Want to sell", true
        );
        SellerResponse app = sellerService.applyForSeller(sellerUser, applyReq);

        // Admin rejects
        SellerResponse rejected = adminSellerService.updateSellerStatus(adminUser, app.id(), SellerStatus.REJECTED, "Incomplete social profile");
        assertEquals(SellerStatus.REJECTED, rejected.status());
        assertEquals("Incomplete social profile", rejected.rejectionReason());

        // Reapplication is allowed and resets status to PENDING
        SellerApplyRequest reapplyReq = new SellerApplyRequest(
            "Jane Seller", sellerUser.getEmail(), "9876543210",
            "@janeseller_official_100k", "Updated profile with 100k followers", true
        );
        SellerResponse reapplied = sellerService.applyForSeller(sellerUser, reapplyReq);
        assertEquals(SellerStatus.PENDING, reapplied.status());
        assertNull(reapplied.rejectionReason());
    }

    @Test
    @DisplayName("3. Seller Attribution, Fraud Protection, and Order Qualification")
    void testSellerAttributionAndQualification() {
        // Approve seller
        SellerApplyRequest applyReq = new SellerApplyRequest(
            "Jane Seller", sellerUser.getEmail(), "9876543210", "@jane", "Streetwear affiliate", true
        );
        SellerResponse sellerResp = sellerService.applyForSeller(sellerUser, applyReq);
        adminSellerService.updateSellerStatus(adminUser, sellerResp.id(), SellerStatus.APPROVED, null);

        // 3a. Invalid code -> no attribution
        Order order1 = createTestOrder(customerUser, new BigDecimal("2499.00"), OrderStatus.PENDING, PaymentStatus.PENDING);
        attributionService.attributeOrder(order1, "INVALID-CODE-XYZ");
        assertFalse(attributionRepository.existsByOrderId(order1.getId()));

        // 3b. Anti-Fraud: Self-attribution detected when buyer is the seller
        Order selfOrder = createTestOrder(sellerUser, new BigDecimal("1999.00"), OrderStatus.PENDING, PaymentStatus.PENDING);
        attributionService.attributeOrder(selfOrder, sellerResp.sellerCode());
        SellerAttribution selfAttr = attributionRepository.findByOrderId(selfOrder.getId()).orElseThrow();
        assertFalse(selfAttr.isQualifying());
        assertEquals("DISQUALIFIED_SELF_REFERRAL", selfAttr.getQualificationStatus());

        // Self-referral cannot be qualified even if payment captured
        selfOrder.setPaymentStatus(PaymentStatus.CAPTURED);
        selfOrder.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(selfOrder);
        attributionService.qualifyOrder(selfOrder.getId());
        assertFalse(attributionRepository.findByOrderId(selfOrder.getId()).get().isQualifying());

        // 3c. Valid customer order attributed
        Order custOrder = createTestOrder(customerUser, new BigDecimal("3499.00"), OrderStatus.PENDING, PaymentStatus.PENDING);
        attributionService.attributeOrder(custOrder, sellerResp.sellerCode());
        SellerAttribution validAttr = attributionRepository.findByOrderId(custOrder.getId()).orElseThrow();
        assertFalse(validAttr.isQualifying());
        assertEquals("PENDING", validAttr.getQualificationStatus());

        // Duplicate attribution call is ignored (still 2 total: self-referral flag + customer order)
        attributionService.attributeOrder(custOrder, sellerResp.sellerCode());
        assertEquals(2, attributionRepository.findAllBySellerId(sellerResp.id(), null).getTotalElements());
        assertEquals(0, attributionRepository.countVerifiedQualifyingSales(sellerResp.id()));

        // 3d. Payment captured -> order qualified & seller count incremented
        custOrder.setPaymentStatus(PaymentStatus.CAPTURED);
        custOrder.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(custOrder);

        attributionService.qualifyOrder(custOrder.getId());
        SellerAttribution qualified = attributionRepository.findByOrderId(custOrder.getId()).orElseThrow();
        assertTrue(qualified.isQualifying());
        assertEquals("QUALIFIED", qualified.getQualificationStatus());

        Seller sellerEntity = sellerRepository.findById(sellerResp.id()).orElseThrow();
        assertEquals(1, sellerEntity.getVerifiedSalesCount());

        // Duplicate qualification call (e.g. duplicate webhook) is idempotent
        attributionService.qualifyOrder(custOrder.getId());
        assertEquals(1, sellerRepository.findById(sellerResp.id()).orElseThrow().getVerifiedSalesCount());

        // 3e. Order cancellation -> disqualified and seller sales count decremented
        attributionService.disqualifyOrder(custOrder.getId(), "DISQUALIFIED_CANCELLED");
        SellerAttribution cancelled = attributionRepository.findByOrderId(custOrder.getId()).orElseThrow();
        assertFalse(cancelled.isQualifying());
        assertEquals("DISQUALIFIED_CANCELLED", cancelled.getQualificationStatus());
        assertEquals(0, sellerRepository.findById(sellerResp.id()).orElseThrow().getVerifiedSalesCount());
    }

    @Test
    @DisplayName("4. Milestones Unlock and Physical Reward Fulfillment Lifecycle")
    void testMilestonesAndRewardClaimFulfillment() {
        SellerApplyRequest applyReq = new SellerApplyRequest(
            "Jane Seller", sellerUser.getEmail(), "9876543210", "@jane", "Brand ambassador", true
        );
        SellerResponse sellerResp = sellerService.applyForSeller(sellerUser, applyReq);
        adminSellerService.updateSellerStatus(adminUser, sellerResp.id(), SellerStatus.APPROVED, null);

        Seller seller = sellerRepository.findById(sellerResp.id()).orElseThrow();

        // Simulate reaching 9 sales -> no milestone unlocked yet
        seller.setVerifiedSalesCount(9);
        milestoneService.evaluateMilestonesForSeller(seller);
        List<SellerReward> rewardsAt9 = rewardRepository.findAllBySellerIdOrderByTierLevelAsc(seller.getId());
        assertTrue(rewardsAt9.isEmpty());

        // 9 -> 10 sales: Unlocks Level 1 ("Rising Seller")
        seller.setVerifiedSalesCount(10);
        milestoneService.evaluateMilestonesForSeller(seller);
        List<SellerReward> rewardsAt10 = rewardRepository.findAllBySellerIdOrderByTierLevelAsc(seller.getId());
        assertEquals(1, rewardsAt10.size());
        SellerReward level1 = rewardsAt10.get(0);
        assertEquals(1, level1.getTierLevel());
        assertEquals("Rising Seller", level1.getMilestoneNameSnapshot());
        assertEquals(SellerRewardStatus.UNLOCKED, level1.getStatus());

        // Concurrent/repeated evaluation doesn't create duplicate rewards
        milestoneService.evaluateMilestonesForSeller(seller);
        assertEquals(1, rewardRepository.findAllBySellerIdOrderByTierLevelAsc(seller.getId()).size());

        // 24 -> 25 sales: Unlocks Level 2 ("Trusted Seller")
        seller.setVerifiedSalesCount(25);
        milestoneService.evaluateMilestonesForSeller(seller);
        List<SellerReward> rewardsAt25 = rewardRepository.findAllBySellerIdOrderByTierLevelAsc(seller.getId());
        assertEquals(2, rewardsAt25.size());
        assertEquals("Trusted Seller", rewardsAt25.get(1).getMilestoneNameSnapshot());

        // 49 -> 50 sales: Unlocks Level 3 ("Elite Seller")
        seller.setVerifiedSalesCount(50);
        milestoneService.evaluateMilestonesForSeller(seller);
        List<SellerReward> rewardsAt50 = rewardRepository.findAllBySellerIdOrderByTierLevelAsc(seller.getId());
        assertEquals(3, rewardsAt50.size());
        assertEquals("Elite Seller", rewardsAt50.get(2).getMilestoneNameSnapshot());

        // 99 -> 100 sales: Unlocks Level 4 ("ODDSI Brand Ambassador")
        seller.setVerifiedSalesCount(100);
        milestoneService.evaluateMilestonesForSeller(seller);
        List<SellerReward> rewardsAt100 = rewardRepository.findAllBySellerIdOrderByTierLevelAsc(seller.getId());
        assertEquals(4, rewardsAt100.size());
        assertEquals("ODDSI Brand Ambassador", rewardsAt100.get(3).getMilestoneNameSnapshot());

        // 4a. Seller claims Level 2 reward (Exclusive T-shirt) with shipping address and size
        SellerReward level2Reward = rewardsAt25.get(1);
        SellerRewardClaimRequest claimReq = new SellerRewardClaimRequest(
            "Jane Seller", "9876543210", "Flat 402, Highrise Tower", "Road No 12, Banjara Hills",
            "Hyderabad", "Telangana", "500034", "L"
        );
        SellerRewardResponse claimed = sellerService.claimReward(sellerUser, level2Reward.getId(), claimReq);
        assertEquals(SellerRewardStatus.CLAIMED, claimed.status());
        assertEquals("Hyderabad", claimed.shippingCity());
        assertEquals("L", claimed.tshirtSize());

        // Trying to claim again throws error
        assertThatThrownBy(() -> sellerService.claimReward(sellerUser, level2Reward.getId(), claimReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already in CLAIMED status");

        // 4b. Admin approves reward claim
        SellerRewardStatusUpdateRequest approveReq = new SellerRewardStatusUpdateRequest(
            SellerRewardStatus.APPROVED, null, null, null, "Approved for fulfillment batch 12"
        );
        SellerRewardResponse approvedReward = adminSellerService.updateRewardStatus(adminUser, level2Reward.getId(), approveReq);
        assertEquals(SellerRewardStatus.APPROVED, approvedReward.status());

        // 4c. Admin marks reward as SHIPPED with carrier and tracking info
        SellerRewardStatusUpdateRequest shipReq = new SellerRewardStatusUpdateRequest(
            SellerRewardStatus.SHIPPED, "BlueDart", "BD-77889900", "https://bluedart.com/track?no=BD-77889900", "Dispatched today"
        );
        SellerRewardResponse shippedReward = adminSellerService.updateRewardStatus(adminUser, level2Reward.getId(), shipReq);
        assertEquals(SellerRewardStatus.SHIPPED, shippedReward.status());
        assertEquals("BlueDart", shippedReward.shippingCarrier());
        assertEquals("BD-77889900", shippedReward.trackingNumber());
        assertNotNull(shippedReward.dispatchedAt());

        // 4d. Admin marks reward as DELIVERED
        SellerRewardStatusUpdateRequest deliverReq = new SellerRewardStatusUpdateRequest(
            SellerRewardStatus.DELIVERED, null, null, null, "Successfully delivered"
        );
        SellerRewardResponse deliveredReward = adminSellerService.updateRewardStatus(adminUser, level2Reward.getId(), deliverReq);
        assertEquals(SellerRewardStatus.DELIVERED, deliveredReward.status());
        assertNotNull(deliveredReward.deliveredAt());
    }
}
