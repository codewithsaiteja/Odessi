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
                new SellerMilestoneConfig(1, "Rising Seller", 10, "Appreciation Certificate & Sticker Pack", "ODESSI appreciation certificate + exclusive sticker pack.", "PHYSICAL_GIFT", "/sellers/seller-level-1-rising.jpg", true),
                new SellerMilestoneConfig(2, "Trusted Seller", 25, "Exclusive ODESSI T-Shirt", "One exclusive ODESSI T shirt as a gift.", "PHYSICAL_GIFT", "/sellers/seller-level-2-trusted.jpg", true),
                new SellerMilestoneConfig(3, "Elite Seller", 50, "Exclusive ODESSI Hoodie & Badge", "One exclusive ODESSI hoodie + a trusted seller badge.", "PHYSICAL_GIFT", "/sellers/seller-level-3-elite.jpg", true),
                new SellerMilestoneConfig(4, "ODDSI Brand Ambassador", 100, "Premium Gift Box & Ambassador Recognition", "Exclusive premium gift box, ambassador recognition and early access to new drops.", "PHYSICAL_GIFT", "/sellers/seller-level-4-ambassador.jpg", true)
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
        if (milestoneRepository.existsByTierLevel(request.tierLevel())) {
            throw new BadRequestException("A milestone tier level " + request.tierLevel() + " already exists");
        }
        if (milestoneRepository.existsByQualifyingSalesThreshold(request.qualifyingSalesThreshold())) {
            throw new BadRequestException("A milestone with sales threshold " + request.qualifyingSalesThreshold() + " already exists");
        }

        SellerMilestoneConfig config = new SellerMilestoneConfig(
            request.tierLevel(),
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

        // Check if tier level or threshold collisions exist
        if (config.getTierLevel() != request.tierLevel() && milestoneRepository.existsByTierLevel(request.tierLevel())) {
            throw new BadRequestException("A milestone tier level " + request.tierLevel() + " already exists");
        }
        if (config.getQualifyingSalesThreshold() != request.qualifyingSalesThreshold() &&
            milestoneRepository.existsByQualifyingSalesThreshold(request.qualifyingSalesThreshold())) {
            throw new BadRequestException("A milestone with sales threshold " + request.qualifyingSalesThreshold() + " already exists");
        }

        config.setTierLevel(request.tierLevel());
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
