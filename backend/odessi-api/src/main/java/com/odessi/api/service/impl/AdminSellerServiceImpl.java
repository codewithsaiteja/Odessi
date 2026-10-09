package com.odessi.api.service.impl;

import com.odessi.api.dto.request.SellerRewardStatusUpdateRequest;
import com.odessi.api.dto.response.*;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.SellerAttributionRepository;
import com.odessi.api.repository.SellerAuditLogRepository;
import com.odessi.api.repository.SellerRepository;
import com.odessi.api.repository.SellerRewardRepository;
import com.odessi.api.service.AdminSellerService;
import com.odessi.api.service.EmailService;
import com.odessi.api.service.SellerMilestoneService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AdminSellerServiceImpl implements AdminSellerService {

    private static final Logger log = LoggerFactory.getLogger(AdminSellerServiceImpl.class);

    private final SellerRepository sellerRepository;
    private final SellerAttributionRepository attributionRepository;
    private final SellerRewardRepository rewardRepository;
    private final SellerAuditLogRepository auditLogRepository;
    private final EmailService emailService;
    private final SellerMilestoneService milestoneService;

    public AdminSellerServiceImpl(
            SellerRepository sellerRepository,
            SellerAttributionRepository attributionRepository,
            SellerRewardRepository rewardRepository,
            SellerAuditLogRepository auditLogRepository,
            EmailService emailService,
            SellerMilestoneService milestoneService) {
        this.sellerRepository = sellerRepository;
        this.attributionRepository = attributionRepository;
        this.rewardRepository = rewardRepository;
        this.auditLogRepository = auditLogRepository;
        this.emailService = emailService;
        this.milestoneService = milestoneService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SellerResponse> getSellers(SellerStatus status, String search, Pageable pageable) {
        return sellerRepository.findSellersWithFilter(status, search, pageable)
                .map(SellerResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public SellerResponse getSellerById(Long id) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SELLER_NOT_FOUND", "Seller not found with id: " + id));
        return SellerResponse.fromEntity(seller);
    }

    @Override
    @Transactional
    public SellerResponse updateSellerStatus(User admin, Long id, SellerStatus newStatus, String reason) {
        Seller seller = sellerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SELLER_NOT_FOUND", "Seller not found with id: " + id));

        SellerStatus oldStatus = seller.getStatus();
        if (oldStatus == newStatus) {
            return SellerResponse.fromEntity(seller);
        }

        seller.setStatus(newStatus);

        if (newStatus == SellerStatus.APPROVED) {
            seller.setApprovedByAdmin(admin);
            seller.setApprovedAt(Instant.now());
            seller.setRejectionReason(null);
            seller.setSuspensionReason(null);

            // Recheck any existing attributions
            int verified = attributionRepository.countVerifiedQualifyingSales(seller.getId());
            seller.setVerifiedSalesCount(verified);

            auditLogRepository.save(new SellerAuditLog(
                seller,
                admin,
                "SELLER_APPROVED",
                "Application approved by admin " + admin.getEmail() + " (Code: " + seller.getSellerCode() + ")"
            ));

            try {
                if (emailService != null) {
                    emailService.sendSellerApplicationApprovedEmail(seller.getEmail(), seller.getFullName(), seller.getSellerCode());
                }
            } catch (Exception e) {
                log.error("Failed to dispatch approval email to {}: {}", seller.getEmail(), e.getMessage());
            }

            milestoneService.evaluateMilestonesForSeller(seller);

        } else if (newStatus == SellerStatus.REJECTED) {
            seller.setRejectedByAdmin(admin);
            seller.setRejectedAt(Instant.now());
            seller.setRejectionReason(reason != null ? reason.trim() : "Application declined by administrator");

            auditLogRepository.save(new SellerAuditLog(
                seller,
                admin,
                "SELLER_REJECTED",
                "Application rejected by admin " + admin.getEmail() + ". Reason: " + seller.getRejectionReason()
            ));

            try {
                if (emailService != null) {
                    emailService.sendSellerApplicationRejectedEmail(seller.getEmail(), seller.getFullName(), seller.getRejectionReason());
                }
            } catch (Exception e) {
                log.error("Failed to dispatch rejection email to {}: {}", seller.getEmail(), e.getMessage());
            }

        } else if (newStatus == SellerStatus.SUSPENDED) {
            seller.setSuspendedByAdmin(admin);
            seller.setSuspendedAt(Instant.now());
            seller.setSuspensionReason(reason != null ? reason.trim() : "Seller suspended by administrator");

            auditLogRepository.save(new SellerAuditLog(
                seller,
                admin,
                "SELLER_SUSPENDED",
                "Seller suspended by admin " + admin.getEmail() + ". Reason: " + seller.getSuspensionReason()
            ));
        }

        Seller saved = sellerRepository.save(seller);
        log.info("Admin {} changed seller {} status from {} to {}", admin.getEmail(), seller.getSellerCode(), oldStatus, newStatus);
        return SellerResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SellerRewardResponse> getRewardClaims(SellerRewardStatus status, Pageable pageable) {
        if (status != null) {
            return rewardRepository.findAllByStatus(status, pageable)
                    .map(SellerRewardResponse::fromEntity);
        }
        return rewardRepository.findAll(pageable)
                .map(SellerRewardResponse::fromEntity);
    }

    @Override
    @Transactional
    public SellerRewardResponse updateRewardStatus(User admin, Long rewardId, SellerRewardStatusUpdateRequest request) {
        SellerReward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new ResourceNotFoundException("REWARD_NOT_FOUND", "Reward claim not found: " + rewardId));

        SellerRewardStatus oldStatus = reward.getStatus();
        SellerRewardStatus newStatus = request.status();

        reward.setStatus(newStatus);
        reward.setUpdatedByAdmin(admin);

        if (request.adminNotes() != null) {
            reward.setAdminNotes(request.adminNotes().trim());
        }

        if (request.shippingCarrier() != null && !request.shippingCarrier().isBlank()) {
            reward.setShippingCarrier(request.shippingCarrier().trim());
        }
        if (request.trackingNumber() != null && !request.trackingNumber().isBlank()) {
            reward.setTrackingNumber(request.trackingNumber().trim());
        }
        if (request.trackingUrl() != null && !request.trackingUrl().isBlank()) {
            reward.setTrackingUrl(request.trackingUrl().trim());
        }

        if (newStatus == SellerRewardStatus.SHIPPED) {
            if (reward.getDispatchedAt() == null) reward.setDispatchedAt(Instant.now());
        } else if (newStatus == SellerRewardStatus.DELIVERED) {
            if (reward.getDispatchedAt() == null) reward.setDispatchedAt(Instant.now());
            if (reward.getDeliveredAt() == null) reward.setDeliveredAt(Instant.now());
        }

        SellerReward saved = rewardRepository.save(reward);

        auditLogRepository.save(new SellerAuditLog(
            reward.getSeller(),
            admin,
            "REWARD_STATUS_CHANGED",
            "Admin " + admin.getEmail() + " updated reward Level " + saved.getTierLevel() + " status from " + oldStatus + " to " + newStatus
                + (saved.getTrackingNumber() != null ? " (Tracking: " + saved.getTrackingNumber() + ")" : "")
        ));

        log.info("Admin {} updated reward id={} status from {} to {}", admin.getEmail(), rewardId, oldStatus, newStatus);
        return SellerRewardResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SellerAttributionResponse> getAttributions(Long sellerId, String status, Pageable pageable) {
        return attributionRepository.findAttributionsWithFilter(sellerId, status, pageable)
                .map(SellerAttributionResponse::fromEntity);
    }

    @Override
    @Transactional
    public SellerAttributionResponse overrideAttribution(User admin, Long attributionId, boolean qualifying, String reason) {
        SellerAttribution attr = attributionRepository.findById(attributionId)
                .orElseThrow(() -> new ResourceNotFoundException("ATTRIBUTION_NOT_FOUND", "Attribution not found: " + attributionId));

        boolean wasQualifying = attr.isQualifying();
        attr.setQualifying(qualifying);
        attr.setQualificationStatus(qualifying ? "QUALIFIED" : "DISQUALIFIED_ADMIN_OVERRIDE");
        attr.setQualificationReason("Admin override by " + admin.getEmail() + ": " + (reason != null ? reason.trim() : "Manual adjustment"));
        if (qualifying) {
            attr.setQualifiedAt(Instant.now());
        } else {
            attr.setDisqualifiedAt(Instant.now());
        }

        SellerAttribution saved = attributionRepository.save(attr);

        Seller seller = attr.getSeller();
        int verified = attributionRepository.countVerifiedQualifyingSales(seller.getId());
        seller.setVerifiedSalesCount(verified);
        sellerRepository.save(seller);

        auditLogRepository.save(new SellerAuditLog(
            seller,
            admin,
            "ATTRIBUTION_OVERRIDE",
            "Admin " + admin.getEmail() + " set attribution order " + attr.getOrderNumber() + " qualifying=" + qualifying
                + ". Verified sales now " + verified + ". Reason: " + reason
        ));

        if (qualifying) {
            milestoneService.evaluateMilestonesForSeller(seller);
        }

        log.info("Admin {} overridden attribution id={} qualifying: {} -> {}", admin.getEmail(), attributionId, wasQualifying, qualifying);
        return SellerAttributionResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SellerAuditLogResponse> getSellerAuditLogs(Long sellerId) {
        return auditLogRepository.findAllBySellerIdOrderByCreatedAtDesc(sellerId)
                .stream()
                .map(SellerAuditLogResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SellerAuditLogResponse> getAllAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(SellerAuditLogResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public SellerPerformanceStatsResponse getPerformanceStats() {
        long totalApplications = sellerRepository.count();
        long pendingApplications = sellerRepository.countByStatus(SellerStatus.PENDING);
        long approvedSellers = sellerRepository.countByStatus(SellerStatus.APPROVED);
        long rejectedSellers = sellerRepository.countByStatus(SellerStatus.REJECTED);
        long suspendedSellers = sellerRepository.countByStatus(SellerStatus.SUSPENDED);

        long verifiedQualifyingSales = attributionRepository.countTotalQualifyingSales();
        java.math.BigDecimal totalEligibleOrderValue = attributionRepository.sumTotalQualifyingOrderValue();
        long pendingAttributions = attributionRepository.countPendingAttributions();
        long disqualifiedAttributions = attributionRepository.countDisqualifiedAttributions();

        long milestonesUnlocked = rewardRepository.count();
        long rewardsAwaitingApproval = rewardRepository.countByStatus(SellerRewardStatus.CLAIMED);
        long rewardsAwaitingShipment = rewardRepository.countByStatus(SellerRewardStatus.APPROVED);
        long rewardsDelivered = rewardRepository.countByStatus(SellerRewardStatus.DELIVERED);

        return new SellerPerformanceStatsResponse(
            totalApplications,
            pendingApplications,
            approvedSellers,
            rejectedSellers,
            suspendedSellers,
            verifiedQualifyingSales,
            totalEligibleOrderValue,
            pendingAttributions,
            disqualifiedAttributions,
            milestonesUnlocked,
            rewardsAwaitingApproval,
            rewardsAwaitingShipment,
            rewardsDelivered
        );
    }
}
