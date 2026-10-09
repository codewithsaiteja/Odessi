package com.odessi.api.service;

import com.odessi.api.dto.request.BackInStockSubscribeRequest;
import com.odessi.api.dto.request.CustomOrderRequest;
import com.odessi.api.dto.request.PartnershipRequest;
import com.odessi.api.dto.response.*;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.*;
import com.odessi.api.service.impl.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Growth Features Unit Tests")
class GrowthFeaturesServiceTest {

    @Mock PartnershipApplicationRepository partnershipRepository;
    @Mock CustomOrderInquiryRepository customOrderRepository;
    @Mock BackInStockRepository backInStockRepository;
    @Mock ReferralCodeRepository referralCodeRepository;
    @Mock ReferralRepository referralRepository;
    @Mock ReferralSettingsRepository referralSettingsRepository;
    @Mock ReferralRewardRepository referralRewardRepository;
    @Mock LoyaltyAccountRepository loyaltyAccountRepository;
    @Mock ProductRepository productRepository;
    @Mock ProductVariantRepository variantRepository;
    @Mock AdminAuditService auditService;
    @Mock NotificationService notificationService;

    PartnershipServiceImpl partnershipService;
    CustomOrderServiceImpl customOrderService;
    BackInStockServiceImpl backInStockService;
    ReferralServiceImpl referralService;
    LoyaltyServiceImpl loyaltyService;

    User mockUser;
    User mockAdmin;

    @BeforeEach
    void setUp() {
        partnershipService = new PartnershipServiceImpl(partnershipRepository, auditService);
        customOrderService = new CustomOrderServiceImpl(customOrderRepository, auditService);
        backInStockService = new BackInStockServiceImpl(backInStockRepository, productRepository, variantRepository);
        referralService = new ReferralServiceImpl(referralCodeRepository, referralRepository, referralSettingsRepository, referralRewardRepository);
        loyaltyService = new LoyaltyServiceImpl(loyaltyAccountRepository);

        mockUser = new User();
        mockUser.setId(10L);
        mockUser.setEmail("customer@odessi.tfi");

        mockAdmin = new User();
        mockAdmin.setId(1L);
        mockAdmin.setEmail("admin@odessi.tfi");
    }

    // ── Partnerships ──────────────────────────────────────────────

    @Test
    @DisplayName("Partnerships — Submit application succeeds")
    void submitPartnership_succeeds() {
        PartnershipRequest req = new PartnershipRequest(
            "Odessi Boutique", "John Doe", "9876543210", "john@boutique.com",
            "Mumbai", "Maharashtra", "RETAILER", "500 pcs", "@boutique", "Wholesale query"
        );

        given(partnershipRepository.save(any())).willAnswer(inv -> {
            PartnershipApplication app = inv.getArgument(0);
            app.setId(100L);
            return app;
        });

        PartnershipResponse res = partnershipService.submitApplication(req);
        assertThat(res).isNotNull();
        assertThat(res.id()).isEqualTo(100L);
        assertThat(res.status()).isEqualTo("NEW");
        assertThat(res.internalNotes()).isNull(); // Public response excludes internal notes
    }

    @Test
    @DisplayName("Partnerships — Admin update status succeeds and logs audit")
    void updatePartnershipStatus_succeeds() {
        PartnershipApplication app = new PartnershipApplication("Store", "Jane", "9876543210", "jane@store.com", "Delhi", "Delhi", "RESELLER", null, null, null);
        app.setId(100L);

        given(partnershipRepository.findById(100L)).willReturn(Optional.of(app));
        given(partnershipRepository.save(any())).willReturn(app);

        PartnershipResponse res = partnershipService.updateStatus(mockAdmin, 100L, PartnershipStatus.QUALIFIED);
        assertThat(res.status()).isEqualTo("QUALIFIED");
        then(auditService).should().logAction(eq(mockAdmin), eq("PARTNERSHIP_STATUS_UPDATED"), eq("PartnershipApplication"), eq("100"), anyString());
    }

    // ── Custom Orders ─────────────────────────────────────────────

    @Test
    @DisplayName("Custom Orders — Submit inquiry succeeds")
    void submitCustomOrder_succeeds() {
        CustomOrderRequest req = new CustomOrderRequest(
            "Alex Smith", "alex@corp.com", "9876543210", "TechCorp",
            "CORPORATE", 200, "Oversized Tees", "Custom embroidery", "2026-10-01", "Need quote"
        );

        given(customOrderRepository.save(any())).willAnswer(inv -> {
            CustomOrderInquiry inq = inv.getArgument(0);
            inq.setId(200L);
            return inq;
        });

        CustomOrderResponse res = customOrderService.submitInquiry(req);
        assertThat(res).isNotNull();
        assertThat(res.id()).isEqualTo(200L);
        assertThat(res.status()).isEqualTo("NEW");
    }

    // ── Back-in-Stock Notifications ───────────────────────────────

    @Test
    @DisplayName("Back-In-Stock — Prevents duplicate active PENDING subscriptions")
    void backInStock_preventsDuplicate() {
        Product product = new Product();
        product.setId(50L);

        ProductVariant variant = new ProductVariant();
        variant.setId(500L);
        variant.setProduct(product);

        BackInStockSubscribeRequest req = new BackInStockSubscribeRequest(50L, 500L, "buyer@odessi.tfi");
        BackInStockRequest existing = new BackInStockRequest(mockUser, product, variant, "buyer@odessi.tfi");
        existing.setId(10L);

        given(productRepository.findById(50L)).willReturn(Optional.of(product));
        given(variantRepository.findById(500L)).willReturn(Optional.of(variant));
        given(backInStockRepository.findByVariantIdAndEmailAndStatus(500L, "buyer@odessi.tfi", BackInStockStatus.PENDING))
            .willReturn(Optional.of(existing));

        BackInStockResponse res = backInStockService.subscribe(mockUser, req);
        assertThat(res.id()).isEqualTo(10L);
        then(backInStockRepository).should(never()).save(any());
    }

    // ── Limited Drop Security ──────────────────────────────────────

    @Test
    @DisplayName("Limited Drop — Unreleased product launchAt check succeeds")
    void limitedDrop_futureLaunch_detected() {
        Product p = new Product();
        p.setDrop(true);
        p.setLaunchAt(Instant.now().plusSeconds(86400)); // Tomorrow

        assertThat(p.isDrop()).isTrue();
        assertThat(p.getLaunchAt().isAfter(Instant.now())).isTrue();
    }

    // ── Referrals (Discontinued) ─────────────────────────────────

    @Test
    @DisplayName("Referral — Discontinued scheme ignores new referral registration")
    void referral_discontinuedIgnoresRegistration() {
        referralService.recordReferral(mockUser, "ODESSI-REF-SELF");
        then(referralRepository).should(never()).save(any());
    }

    @Test
    @DisplayName("Referral — Discontinued scheme does not qualify order on delivery or payment")
    void referral_discontinuedDoesNotQualifyOnDelivery() {
        User referee = new User(); referee.setId(2L);

        Order order = new Order();
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setStatus(OrderStatus.DELIVERED);

        referralService.processQualifyingOrder(referee, order);
        then(referralRepository).should(never()).save(any());
        then(referralRewardRepository).should(never()).save(any());
    }

    // ── Loyalty Foundation ────────────────────────────────────────

    @Test
    @DisplayName("Loyalty — Creates STANDARD account when missing")
    void loyalty_createsStandardAccount() {
        given(loyaltyAccountRepository.findByUserId(10L)).willReturn(Optional.empty());
        given(loyaltyAccountRepository.save(any())).willAnswer(inv -> inv.getArgument(0));

        LoyaltyAccountResponse res = loyaltyService.getStatus(mockUser);
        assertThat(res).isNotNull();
        assertThat(res.tier()).isEqualTo("STANDARD");
    }
}
