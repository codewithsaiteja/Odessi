package com.odessi.api.service.impl;

import com.odessi.api.dto.request.PartnershipRequest;
import com.odessi.api.dto.response.PartnershipResponse;
import com.odessi.api.entity.PartnershipApplication;
import com.odessi.api.entity.PartnershipStatus;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.PartnershipApplicationRepository;
import com.odessi.api.service.AdminAuditService;
import com.odessi.api.service.PartnershipService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PartnershipServiceImpl implements PartnershipService {

    private final PartnershipApplicationRepository repository;
    private final AdminAuditService auditService;

    public PartnershipServiceImpl(PartnershipApplicationRepository repository, AdminAuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public PartnershipResponse submitApplication(PartnershipRequest request) {
        PartnershipApplication app = new PartnershipApplication(
            request.businessName(),
            request.contactPerson(),
            request.phone(),
            request.email(),
            request.city(),
            request.state(),
            request.businessType(),
            request.estimatedMonthlyRequirement(),
            request.websiteInstagram(),
            request.message()
        );

        PartnershipApplication saved = repository.save(app);
        // Map to public response without internal notes
        return toResponse(saved, false);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PartnershipResponse> getApplications(PartnershipStatus status, String search, Pageable pageable) {
        Page<PartnershipApplication> page = (status != null)
            ? repository.findByStatus(status, pageable)
            : repository.findAll(pageable);

        return page.map(app -> toResponse(app, true));
    }

    @Override
    @Transactional(readOnly = true)
    public PartnershipResponse getApplicationById(Long id) {
        PartnershipApplication app = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PARTNERSHIP_NOT_FOUND", "Partnership application not found: " + id));
        return toResponse(app, true);
    }

    @Override
    @Transactional
    public PartnershipResponse updateStatus(User admin, Long id, PartnershipStatus newStatus) {
        PartnershipApplication app = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PARTNERSHIP_NOT_FOUND", "Partnership application not found: " + id));

        PartnershipStatus oldStatus = app.getStatus();
        if (oldStatus == newStatus) {
            return toResponse(app, true);
        }

        app.setStatus(newStatus);
        PartnershipApplication updated = repository.save(app);

        auditService.logAction(admin, "PARTNERSHIP_STATUS_UPDATED", "PartnershipApplication", id.toString(),
            "Updated partnership application status from " + oldStatus + " to " + newStatus);

        return toResponse(updated, true);
    }

    @Override
    @Transactional
    public PartnershipResponse updateInternalNotes(User admin, Long id, String internalNotes) {
        PartnershipApplication app = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("PARTNERSHIP_NOT_FOUND", "Partnership application not found: " + id));

        app.setInternalNotes(internalNotes);
        PartnershipApplication updated = repository.save(app);

        auditService.logAction(admin, "PARTNERSHIP_NOTES_UPDATED", "PartnershipApplication", id.toString(),
            "Updated internal notes for partnership application ID " + id);

        return toResponse(updated, true);
    }

    private PartnershipResponse toResponse(PartnershipApplication app, boolean includeInternalNotes) {
        return new PartnershipResponse(
            app.getId(),
            app.getBusinessName(),
            app.getContactPerson(),
            app.getPhone(),
            app.getEmail(),
            app.getCity(),
            app.getState(),
            app.getBusinessType(),
            app.getEstimatedMonthlyRequirement(),
            app.getWebsiteInstagram(),
            app.getMessage(),
            app.getStatus().name(),
            includeInternalNotes ? app.getInternalNotes() : null,
            app.getCreatedAt(),
            app.getUpdatedAt()
        );
    }
}
