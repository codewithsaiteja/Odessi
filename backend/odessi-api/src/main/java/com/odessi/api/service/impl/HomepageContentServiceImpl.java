package com.odessi.api.service.impl;

import com.odessi.api.dto.request.UpdateHomepageContentRequest;
import com.odessi.api.dto.response.HomepageContentResponse;
import com.odessi.api.entity.HomepageContent;
import com.odessi.api.entity.User;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.HomepageContentRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.AdminAuditService;
import com.odessi.api.service.HomepageContentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class HomepageContentServiceImpl implements HomepageContentService {

    private final HomepageContentRepository repository;
    private final UserRepository userRepository;
    private final AdminAuditService auditService;
    private final com.odessi.api.service.MediaStorageService mediaStorageService;

    public HomepageContentServiceImpl(
            HomepageContentRepository repository,
            UserRepository userRepository,
            AdminAuditService auditService,
            com.odessi.api.service.MediaStorageService mediaStorageService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.mediaStorageService = mediaStorageService;
    }

    private HomepageContentResponse toResponse(HomepageContent c) {
        return new HomepageContentResponse(
                c.getId(),
                c.getSectionKey(),
                c.getTitle(),
                c.getEyebrow(),
                c.getHeadline(),
                c.getSubHeadline(),
                c.getBody(),
                c.getPrimaryCtaLabel(),
                c.getPrimaryCtaUrl(),
                c.getSecondaryCtaLabel(),
                c.getSecondaryCtaUrl(),
                c.getMediaUrl(),
                c.getMobileMediaUrl(),
                c.isActive(),
                c.getCustomPayload(),
                c.getUpdatedAt()
        );
    }

    @Override
    public List<HomepageContentResponse> getActiveSections() {
        return repository.findByActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<HomepageContentResponse> getAllSectionsForAdmin() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public HomepageContentResponse getSection(String sectionKey) {
        HomepageContent content = repository.findBySectionKey(sectionKey)
                .orElseThrow(() -> new ResourceNotFoundException("CONTENT_SECTION_NOT_FOUND", "Homepage content section not found: " + sectionKey));
        return toResponse(content);
    }

    @Override
    @Transactional
    public HomepageContentResponse updateSection(String sectionKey, UpdateHomepageContentRequest request, String adminEmail) {
        HomepageContent content = repository.findBySectionKey(sectionKey)
                .orElseGet(() -> {
                    HomepageContent created = new HomepageContent();
                    created.setSectionKey(sectionKey);
                    return created;
                });

        if (request.title() != null) content.setTitle(request.title().trim());
        if (request.eyebrow() != null) content.setEyebrow(request.eyebrow().trim());
        if (request.headline() != null) content.setHeadline(request.headline().trim());
        if (request.subHeadline() != null) content.setSubHeadline(request.subHeadline().trim());
        if (request.body() != null) content.setBody(request.body().trim());
        if (request.primaryCtaLabel() != null) content.setPrimaryCtaLabel(request.primaryCtaLabel().trim());
        if (request.primaryCtaUrl() != null) content.setPrimaryCtaUrl(request.primaryCtaUrl().trim());
        if (request.secondaryCtaLabel() != null) content.setSecondaryCtaLabel(request.secondaryCtaLabel().trim());
        if (request.secondaryCtaUrl() != null) content.setSecondaryCtaUrl(request.secondaryCtaUrl().trim());
        if (request.mediaUrl() != null) content.setMediaUrl(request.mediaUrl().trim());
        if (request.mobileMediaUrl() != null) content.setMobileMediaUrl(request.mobileMediaUrl().trim());
        if (request.active() != null) content.setActive(request.active());
        if (request.customPayload() != null) content.setCustomPayload(request.customPayload());

        HomepageContent saved = repository.save(content);

        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(
                admin,
                "HOMEPAGE_CONTENT_UPDATED",
                "HomepageContent",
                sectionKey,
                "Updated homepage section: " + sectionKey
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public String uploadContentMedia(org.springframework.web.multipart.MultipartFile file) {
        return mediaStorageService.storeContentImage(file);
    }
}
