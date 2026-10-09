package com.odessi.api.service.impl;

import com.odessi.api.dto.request.SellerMilestoneConfigRequest;
import com.odessi.api.dto.response.SellerMilestoneConfigResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.SellerAuditLogRepository;
import com.odessi.api.repository.SellerMilestoneConfigRepository;
import com.odessi.api.repository.SellerRewardRepository;
import com.odessi.api.service.SellerMilestoneService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SellerMilestoneServiceImpl implements SellerMilestoneService {

    private static final Logger log = LoggerFactory.getLogger(SellerMilestoneServiceImpl.class);

    private final SellerMilestoneConfigRepository milestoneRepository;
    private final SellerRewardRepository rewardRepository;
    private final SellerAuditLogRepository auditLogRepository;

    public SellerMilestoneServiceImpl(
            SellerMilestoneConfigRepository milestoneRepository,
            SellerRewardRepository rewardRepository,
            SellerAuditLogRepository auditLogRepository) {
        this.milestoneRepository = milestoneRepository;
        this.rewardRepository = rewardRepository;
        this.auditLogRepository = auditLogRepository;
    }

    private void ensureDefaultMilestones() {
        if (milestoneRepository.count() == 0) {
            milestoneRepository.saveAll(List.of(
                new SellerMilestoneConfig(1, "Rising Seller", 10, "Exclusive ODESSI Matte Bracelet Set", "Custom matte-black ODESSI branded silicone band and velvet pouch with certificate.", "PHYSICAL_GIFT", "/sellers/gifts/milestone-10.webp", true),
                new SellerMilestoneConfig(2, "Trusted Seller", 25, "Exclusive ODESSI T-Shirt Gift Set", "Luxury matte box with custom tissue wrap containing an exclusive ODESSI tee.", "PHYSICAL_GIFT", "/sellers/gifts/milestone-25.webp", true),
                new SellerMilestoneConfig(3, "Elite Seller", 50, "Luxury ODESSI Hoodie & Gift Box", "Premium heavyweight ODESSI French terry hoodie in luxury presentation packaging with VIP correspondence.", "PHYSICAL_GIFT", "/sellers/gifts/milestone-50.webp", true),
                new SellerMilestoneConfig(4, "ODDSI Brand Ambassador", 100, "ODDSI Brand Ambassador Luxury Hamper", "The complete luxury ambassador unboxing chest with hoodie, tee, stainless thermos, cap, socks, keychain, and gold membership recognition.", "PHYSICAL_GIFT", "/sellers/gifts/milestone-100.webp", true)
            ));
        }
    }

    @Override
    @Transactional
    public List<SellerMilestoneConfigResponse> getActiveMilestones() {
        ensureDefaultMilestones();
        return milestoneRepository.findAllByActiveTrueOrderByQualifyingSalesThresholdAsc()
                .stream()
                .map(SellerMilestoneConfigResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public List<SellerMilestoneConfigResponse> getAllMilestones() {
        ensureDefaultMilestones();
        return milestoneRepository.findAllByOrderByQualifyingSalesThresholdAsc()
                .stream()
                .map(SellerMilestoneConfigResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SellerMilestoneConfigResponse getMilestoneById(Long id) {
        SellerMilestoneConfig config = milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MILESTONE_NOT_FOUND", "Milestone config not found with id: " + id));
        return SellerMilestoneConfigResponse.fromEntity(config);
    }

    @Override
    @Transactional
    public SellerMilestoneConfigResponse createMilestone(User admin, SellerMilestoneConfigRequest request) {
        if (request.qualifyingSalesThreshold() <= 0) {
            throw new BadRequestException("Sales threshold must be greater than zero");
        }
        int tierLevel = request.tierLevel() != null ? request.tierLevel() : (
            milestoneRepository.findAll().stream().mapToInt(SellerMilestoneConfig::getTierLevel).max().orElse(0) + 1
        );
        if (milestoneRepository.existsByTierLevel(tierLevel)) {
            throw new BadRequestException("A milestone tier level " + tierLevel + " already exists");
        }
        if (milestoneRepository.existsByQualifyingSalesThreshold(request.qualifyingSalesThreshold())) {
            throw new BadRequestException("A milestone with sales threshold " + request.qualifyingSalesThreshold() + " already exists");
        }

        SellerMilestoneConfig config = new SellerMilestoneConfig(
            tierLevel,
            request.milestoneName().trim(),
            request.qualifyingSalesThreshold(),
            request.rewardTitle().trim(),
            request.rewardDescription().trim(),
            request.rewardType() != null ? request.rewardType() : "PHYSICAL_GIFT",
            request.imageUrl(),
            request.active() != null ? request.active() : true
        );

        SellerMilestoneConfig saved = milestoneRepository.save(config);

        auditLogRepository.save(new SellerAuditLog(
            null,
            admin,
            "MILESTONE_CONFIG_CREATED",
            "Created milestone tier " + saved.getTierLevel() + " (" + saved.getMilestoneName() + ") threshold " + saved.getQualifyingSalesThreshold()
        ));

        return SellerMilestoneConfigResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public SellerMilestoneConfigResponse updateMilestone(User admin, Long id, SellerMilestoneConfigRequest request) {
        SellerMilestoneConfig config = milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MILESTONE_NOT_FOUND", "Milestone config not found with id: " + id));

        if (request.qualifyingSalesThreshold() <= 0) {
            throw new BadRequestException("Sales threshold must be greater than zero");
        }

        int targetTier = request.tierLevel() != null ? request.tierLevel() : config.getTierLevel();
        // Check if tier level or threshold collisions exist
        if (config.getTierLevel() != targetTier && milestoneRepository.existsByTierLevel(targetTier)) {
            throw new BadRequestException("A milestone tier level " + targetTier + " already exists");
        }
        if (config.getQualifyingSalesThreshold() != request.qualifyingSalesThreshold() &&
            milestoneRepository.existsByQualifyingSalesThreshold(request.qualifyingSalesThreshold())) {
            throw new BadRequestException("A milestone with sales threshold " + request.qualifyingSalesThreshold() + " already exists");
        }

        config.setTierLevel(targetTier);
        config.setMilestoneName(request.milestoneName().trim());
        config.setQualifyingSalesThreshold(request.qualifyingSalesThreshold());
        config.setRewardTitle(request.rewardTitle().trim());
        config.setRewardDescription(request.rewardDescription().trim());
        if (request.rewardType() != null) config.setRewardType(request.rewardType());
        if (request.imageUrl() != null) config.setImageUrl(request.imageUrl());
        if (request.active() != null) config.setActive(request.active());
        config.setVersion(config.getVersion() + 1);

        SellerMilestoneConfig updated = milestoneRepository.save(config);

        auditLogRepository.save(new SellerAuditLog(
            null,
            admin,
            "MILESTONE_CONFIG_UPDATED",
            "Updated milestone tier " + updated.getTierLevel() + " (" + updated.getMilestoneName() + ") threshold " + updated.getQualifyingSalesThreshold() + " v" + updated.getVersion()
        ));

        return SellerMilestoneConfigResponse.fromEntity(updated);
    }

    @Override
    @Transactional
    public void evaluateMilestonesForSeller(Seller seller) {
        if (seller == null || seller.getStatus() != SellerStatus.APPROVED) {
            return;
        }

        ensureDefaultMilestones();
        int verifiedSales = seller.getVerifiedSalesCount();
        List<SellerMilestoneConfig> configs = milestoneRepository.findAllByActiveTrueOrderByQualifyingSalesThresholdAsc();

        for (SellerMilestoneConfig config : configs) {
            if (verifiedSales >= config.getQualifyingSalesThreshold()) {
                boolean alreadyAwarded = rewardRepository.existsBySellerIdAndMilestoneConfigId(seller.getId(), config.getId());
                if (!alreadyAwarded) {
                    SellerReward reward = new SellerReward(seller, config, verifiedSales);
                    rewardRepository.save(reward);

                    auditLogRepository.save(new SellerAuditLog(
                        seller,
                        null,
                        "MILESTONE_UNLOCKED",
                        "Unlocked milestone Level " + config.getTierLevel() + " (" + config.getMilestoneName() + ") at " + verifiedSales + " sales."
                    ));

                    log.info("Unlocked reward for seller id={} ({}) milestone='{}' tier={}",
                        seller.getId(), seller.getSellerCode(), config.getMilestoneName(), config.getTierLevel());
                }
            }
        }
    }
}
