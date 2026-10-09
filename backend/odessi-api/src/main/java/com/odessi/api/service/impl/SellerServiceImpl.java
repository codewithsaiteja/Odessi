package com.odessi.api.service.impl;

import com.odessi.api.dto.request.SellerApplyRequest;
import com.odessi.api.dto.request.SellerRewardClaimRequest;
import com.odessi.api.dto.response.*;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.*;
import com.odessi.api.service.SellerMilestoneService;
import com.odessi.api.service.SellerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class SellerServiceImpl implements SellerService {

    private static final Logger log = LoggerFactory.getLogger(SellerServiceImpl.class);
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private final SecureRandom random = new SecureRandom();

    private final SellerRepository sellerRepository;
    private final SellerAttributionRepository attributionRepository;
    private final SellerRewardRepository rewardRepository;
    private final SellerAuditLogRepository auditLogRepository;
    private final SellerMilestoneService milestoneService;

    public SellerServiceImpl(
            SellerRepository sellerRepository,
            SellerAttributionRepository attributionRepository,
            SellerRewardRepository rewardRepository,
            SellerAuditLogRepository auditLogRepository,
            SellerMilestoneService milestoneService) {
        this.sellerRepository = sellerRepository;
        this.attributionRepository = attributionRepository;
        this.rewardRepository = rewardRepository;
        this.auditLogRepository = auditLogRepository;
        this.milestoneService = milestoneService;
    }

    @Override
    @Transactional
    public SellerResponse applyForSeller(User user, SellerApplyRequest request) {
        if (user == null || user.getId() == null) {
            throw new BadRequestException("Authentication required to apply as seller");
        }

        Optional<Seller> existingOpt = sellerRepository.findByUserId(user.getId());
        if (existingOpt.isPresent()) {
            Seller existing = existingOpt.get();
            if (existing.getStatus() == SellerStatus.PENDING) {
                throw new BadRequestException("You already have an application awaiting admin review.");
            }
            if (existing.getStatus() == SellerStatus.APPROVED) {
                throw new BadRequestException("You are already an approved seller.");
            }
            if (existing.getStatus() == SellerStatus.SUSPENDED) {
                throw new BadRequestException("Your seller account is currently suspended. Please contact support.");
            }

            // If REJECTED, allow re-application
            existing.setFullName(request.fullName().trim());
            existing.setEmail(request.email().trim());
            existing.setPhone(request.phone().trim());
            existing.setSocialChannel(request.socialChannel().trim());
            existing.setApplicationReason(request.applicationReason().trim());
            existing.setStatus(SellerStatus.PENDING);
            existing.setRejectionReason(null);
            existing.setTermsAccepted(Boolean.TRUE.equals(request.termsAccepted()));

            Seller updated = sellerRepository.save(existing);
            auditLogRepository.save(new SellerAuditLog(
                updated,
                null,
                "APPLICATION_RESUBMITTED",
                "Seller resubmitted application for admin review."
            ));
            return SellerResponse.fromEntity(updated);
        }

        // Generate a clean, unique seller code: e.g. "OD-S-XXXX"
        String sellerCode = generateUniqueSellerCode(request.fullName());

        Seller seller = new Seller(
            user,
            sellerCode,
            request.fullName().trim(),
            request.email().trim(),
            request.phone().trim(),
            request.socialChannel().trim(),
            request.applicationReason().trim()
        );
        seller.setTermsAccepted(Boolean.TRUE.equals(request.termsAccepted()));
        seller.setStatus(SellerStatus.PENDING);

        Seller saved = sellerRepository.save(seller);

        auditLogRepository.save(new SellerAuditLog(
            saved,
            null,
            "APPLICATION_SUBMITTED",
            "Submitted initial seller application with channel: " + saved.getSocialChannel()
        ));

        log.info("New seller application submitted: id={} user={} code={}", saved.getId(), user.getEmail(), saved.getSellerCode());
        return SellerResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SellerResponse getSellerStatus(User user) {
        if (user == null || user.getId() == null) {
            return null;
        }
        return sellerRepository.findByUserId(user.getId())
                .map(SellerResponse::fromEntity)
                .orElse(null);
    }

    @Override
    @Transactional
    public SellerDashboardResponse getSellerDashboard(User user) {
        if (user == null || user.getId() == null) {
            throw new BadRequestException("Authentication required");
        }

        Seller seller = sellerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("SELLER_NOT_FOUND", "No seller profile exists for this account."));

        if (seller.getStatus() != SellerStatus.APPROVED) {
            throw new BadRequestException("SELLER_NOT_APPROVED",
                "Access restricted: Seller account is currently in " + seller.getStatus() + " status.");
        }

        int verifiedSales = attributionRepository.countVerifiedQualifyingSales(seller.getId());
        if (seller.getVerifiedSalesCount() != verifiedSales) {
            seller.setVerifiedSalesCount(verifiedSales);
            seller = sellerRepository.save(seller);
            milestoneService.evaluateMilestonesForSeller(seller);
        }
        int pendingOrders = attributionRepository.countPendingAttributedOrders(seller.getId());

        List<SellerMilestoneConfigResponse> milestones = milestoneService.getActiveMilestones();

        // Resolve current and next milestones
        SellerMilestoneConfigResponse currentMilestone = null;
        SellerMilestoneConfigResponse nextMilestone = null;

        for (SellerMilestoneConfigResponse m : milestones) {
            if (verifiedSales >= m.qualifyingSalesThreshold()) {
                currentMilestone = m;
            } else if (nextMilestone == null) {
                nextMilestone = m;
            }
        }

        // Calculate progress percentage and remaining sales
        int remainingSales = 0;
        double progressPercent = 0.0;

        if (nextMilestone != null) {
            int previousThreshold = currentMilestone != null ? currentMilestone.qualifyingSalesThreshold() : 0;
            int nextThreshold = nextMilestone.qualifyingSalesThreshold();
            remainingSales = Math.max(0, nextThreshold - verifiedSales);

            int span = Math.max(1, nextThreshold - previousThreshold);
            int progressInTier = Math.max(0, verifiedSales - previousThreshold);
            progressPercent = Math.min(100.0, Math.round(((double) progressInTier / span) * 1000.0) / 10.0);
        } else {
            // Reached top milestone
            remainingSales = 0;
            progressPercent = 100.0;
        }

        List<SellerRewardResponse> rewards = rewardRepository.findAllBySellerIdOrderByTierLevelAsc(seller.getId())
                .stream()
                .map(SellerRewardResponse::fromEntityForSeller)
                .toList();

        String shareableLink = "https://www.odessitfi.me/?seller=" + seller.getSellerCode();

        return new SellerDashboardResponse(
            SellerResponse.fromEntity(seller),
            verifiedSales,
            pendingOrders,
            currentMilestone,
            nextMilestone,
            remainingSales,
            progressPercent,
            milestones,
            rewards,
            shareableLink
        );
    }

    @Override
    @Transactional
    public SellerRewardResponse claimReward(User user, Long rewardId, SellerRewardClaimRequest request) {
        if (user == null || user.getId() == null) {
            throw new BadRequestException("Authentication required");
        }

        Seller seller = sellerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("SELLER_NOT_FOUND", "No seller account found."));

        if (seller.getStatus() != SellerStatus.APPROVED) {
            throw new BadRequestException("SELLER_NOT_APPROVED", "Seller account must be active to claim rewards.");
        }

        SellerReward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new ResourceNotFoundException("REWARD_NOT_FOUND", "Reward not found: " + rewardId));

        if (!reward.getSeller().getId().equals(seller.getId())) {
            throw new BadRequestException("REWARD_ACCESS_DENIED", "This reward does not belong to your account.");
        }

        if (reward.getStatus() != SellerRewardStatus.UNLOCKED) {
            throw new BadRequestException("REWARD_NOT_CLAIMABLE",
                "Reward is already in " + reward.getStatus() + " status and cannot be claimed again.");
        }

        reward.setStatus(SellerRewardStatus.CLAIMED);
        reward.setClaimedAt(Instant.now());
        reward.setShippingFullName(request.fullName().trim());
        reward.setShippingPhone(request.phone().trim());
        reward.setShippingAddressLine1(request.addressLine1().trim());
        reward.setShippingAddressLine2(request.addressLine2() != null ? request.addressLine2().trim() : null);
        reward.setShippingCity(request.city().trim());
        reward.setShippingState(request.state().trim());
        reward.setShippingPostalCode(request.postalCode().trim());
        if (request.tshirtSize() != null && !request.tshirtSize().isBlank()) {
            reward.setTshirtSize(request.tshirtSize().trim().toUpperCase());
        }

        SellerReward saved = rewardRepository.save(reward);

        auditLogRepository.save(new SellerAuditLog(
            seller,
            null,
            "REWARD_CLAIMED",
            "Claimed milestone Level " + saved.getTierLevel() + " gift (" + saved.getRewardTitleSnapshot() + ") for delivery to " + saved.getShippingCity()
        ));

        log.info("Seller {} claimed reward id={} ({})", seller.getSellerCode(), saved.getId(), saved.getRewardTitleSnapshot());
        return SellerRewardResponse.fromEntityForSeller(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean validateSellerCode(String code) {
        if (code == null || code.isBlank()) return false;
        String normalized = code.trim().toUpperCase();
        return sellerRepository.findBySellerCode(normalized)
                .map(s -> s.getStatus() == SellerStatus.APPROVED)
                .orElse(false);
    }

    private String generateUniqueSellerCode(String name) {
        String base = "OD-S-";
        if (name != null && !name.isBlank()) {
            String cleanName = name.replaceAll("[^a-zA-Z]", "").toUpperCase();
            if (cleanName.length() >= 3) {
                base = "OD-" + cleanName.substring(0, Math.min(5, cleanName.length())) + "-";
            }
        }

        for (int i = 0; i < 100; i++) {
            StringBuilder sb = new StringBuilder(base);
            for (int c = 0; c < 4; c++) {
                sb.append(CODE_ALPHABET.charAt(random.nextInt(CODE_ALPHABET.length())));
            }
            String candidate = sb.toString();
            if (!sellerRepository.existsBySellerCode(candidate)) {
                return candidate;
            }
        }
        return "OD-S-" + System.currentTimeMillis();
    }
}
