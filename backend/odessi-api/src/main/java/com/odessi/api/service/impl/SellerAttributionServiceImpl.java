package com.odessi.api.service.impl;

import com.odessi.api.entity.*;
import com.odessi.api.repository.SellerAttributionRepository;
import com.odessi.api.repository.SellerAuditLogRepository;
import com.odessi.api.repository.SellerRepository;
import com.odessi.api.service.SellerAttributionService;
import com.odessi.api.service.SellerMilestoneService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class SellerAttributionServiceImpl implements SellerAttributionService {

    private static final Logger log = LoggerFactory.getLogger(SellerAttributionServiceImpl.class);

    private final SellerRepository sellerRepository;
    private final SellerAttributionRepository attributionRepository;
    private final SellerMilestoneService milestoneService;
    private final SellerAuditLogRepository auditLogRepository;

    public SellerAttributionServiceImpl(
            SellerRepository sellerRepository,
            SellerAttributionRepository attributionRepository,
            SellerMilestoneService milestoneService,
            SellerAuditLogRepository auditLogRepository) {
        this.sellerRepository = sellerRepository;
        this.attributionRepository = attributionRepository;
        this.milestoneService = milestoneService;
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public void attributeOrder(Order order, String sellerCode) {
        if (order == null || sellerCode == null || sellerCode.isBlank()) {
            return;
        }

        String normalizedCode = sellerCode.trim().toUpperCase();
        Optional<Seller> sellerOpt = sellerRepository.findBySellerCode(normalizedCode);
        if (sellerOpt.isEmpty()) {
            log.warn("Invalid seller code '{}' provided for order {}", normalizedCode, order.getOrderNumber());
            return;
        }

        Seller seller = sellerOpt.get();

        // 1. Seller status check: Only APPROVED sellers can receive attribution
        if (seller.getStatus() != SellerStatus.APPROVED) {
            log.warn("Seller '{}' is in status {} - order {} attribution rejected",
                normalizedCode, seller.getStatus(), order.getOrderNumber());
            return;
        }

        // 2. Prevent duplicate attribution for the same order
        if (attributionRepository.existsByOrderId(order.getId())) {
            log.info("Order {} already has an attribution record. Skipping.", order.getOrderNumber());
            return;
        }

        // 3. Anti-Fraud Self-Referral Check: Seller cannot be the customer
        if (order.getUser() != null && order.getUser().getId().equals(seller.getUser().getId())) {
            log.warn("Fraud alert: Self-attribution detected for order {} and seller {}",
                order.getOrderNumber(), seller.getSellerCode());

            SellerAttribution selfAttr = new SellerAttribution(
                order, seller, order.getUser(), seller.getSellerCode(),
                order.getOrderNumber(), order.getTotalAmount()
            );
            selfAttr.setQualifying(false);
            selfAttr.setQualificationStatus("DISQUALIFIED_SELF_REFERRAL");
            selfAttr.setQualificationReason("Self-attribution: Buyer matches Seller account");
            attributionRepository.save(selfAttr);

            auditLogRepository.save(new SellerAuditLog(
                seller,
                null,
                "ORDER_ATTRIBUTION_FLAGGED",
                "Self-referral flagged on order " + order.getOrderNumber()
            ));
            return;
        }

        // 4. Save pending attribution
        SellerAttribution attribution = new SellerAttribution(
            order, seller, order.getUser(), seller.getSellerCode(),
            order.getOrderNumber(), order.getTotalAmount()
        );
        attribution.setQualifying(false);
        attribution.setQualificationStatus("PENDING");
        attributionRepository.save(attribution);

        auditLogRepository.save(new SellerAuditLog(
            seller,
            null,
            "ORDER_ATTRIBUTED",
            "Order " + order.getOrderNumber() + " (₹" + order.getTotalAmount() + ") attributed to " + seller.getSellerCode()
        ));

        log.info("Successfully attributed order {} to approved seller {}", order.getOrderNumber(), seller.getSellerCode());
    }

    @Override
    @Transactional
    public void qualifyOrder(Long orderId) {
        if (orderId == null) return;

        Optional<SellerAttribution> attrOpt = attributionRepository.findByOrderId(orderId);
        if (attrOpt.isEmpty()) {
            return;
        }

        SellerAttribution attribution = attrOpt.get();

        // Idempotency: Already qualified
        if (attribution.isQualifying() && "QUALIFIED".equals(attribution.getQualificationStatus())) {
            return;
        }

        // Fraud check: If flagged as self-referral, never qualify
        if ("DISQUALIFIED_SELF_REFERRAL".equals(attribution.getQualificationStatus())) {
            log.warn("Order {} attribution is marked DISQUALIFIED_SELF_REFERRAL. Qualification skipped.", orderId);
            return;
        }

        Order order = attribution.getOrder();
        Seller seller = attribution.getSeller();

        // Verify seller is still APPROVED
        if (seller.getStatus() != SellerStatus.APPROVED) {
            log.warn("Seller {} is not APPROVED (status={}). Qualification skipped for order {}.",
                seller.getSellerCode(), seller.getStatus(), order.getOrderNumber());
            return;
        }

        // Revalidate order payment status: Must be CAPTURED or PAID
        if (order.getPaymentStatus() != PaymentStatus.CAPTURED) {
            log.warn("Order {} payment status is {} (not CAPTURED). Qualification skipped.",
                order.getOrderNumber(), order.getPaymentStatus());
            return;
        }

        // Revalidate order status: Must not be CANCELLED or PAYMENT_FAILED
        if (order.getStatus() == OrderStatus.CANCELLED || order.getStatus() == OrderStatus.PAYMENT_FAILED) {
            log.warn("Order {} status is {}. Qualification skipped.", order.getOrderNumber(), order.getStatus());
            return;
        }

        // Qualify the sale
        attribution.setQualifying(true);
        attribution.setQualificationStatus("QUALIFIED");
        attribution.setQualificationReason("Verified payment captured on order " + order.getOrderNumber());
        attribution.setQualifiedAt(Instant.now());
        attributionRepository.save(attribution);

        // Recalculate verified sales count authoritatively
        int verifiedCount = attributionRepository.countVerifiedQualifyingSales(seller.getId());
        seller.setVerifiedSalesCount(verifiedCount);
        sellerRepository.save(seller);

        auditLogRepository.save(new SellerAuditLog(
            seller,
            null,
            "ORDER_QUALIFIED",
            "Order " + order.getOrderNumber() + " qualified. Total verified sales: " + verifiedCount
        ));

        log.info("Order {} qualified for seller {}. New verified sales count: {}",
            order.getOrderNumber(), seller.getSellerCode(), verifiedCount);

        // Evaluate milestone unlock
        milestoneService.evaluateMilestonesForSeller(seller);
    }

    @Override
    @Transactional
    public void disqualifyOrder(Long orderId, String reason) {
        if (orderId == null) return;

        Optional<SellerAttribution> attrOpt = attributionRepository.findByOrderId(orderId);
        if (attrOpt.isEmpty()) {
            return;
        }

        SellerAttribution attribution = attrOpt.get();
        if (!attribution.isQualifying()) {
            return;
        }

        attribution.setQualifying(false);
        attribution.setQualificationStatus(reason != null ? reason : "DISQUALIFIED_CANCELLED");
        attribution.setDisqualifiedAt(Instant.now());
        attributionRepository.save(attribution);

        Seller seller = attribution.getSeller();
        int verifiedCount = attributionRepository.countVerifiedQualifyingSales(seller.getId());
        seller.setVerifiedSalesCount(verifiedCount);
        sellerRepository.save(seller);

        auditLogRepository.save(new SellerAuditLog(
            seller,
            null,
            "ORDER_DISQUALIFIED",
            "Order " + attribution.getOrderNumber() + " disqualified (" + attribution.getQualificationStatus() + "). Total verified sales: " + verifiedCount
        ));

        log.info("Order {} disqualified for seller {}. Updated verified sales count: {}",
            attribution.getOrderNumber(), seller.getSellerCode(), verifiedCount);
    }
}
