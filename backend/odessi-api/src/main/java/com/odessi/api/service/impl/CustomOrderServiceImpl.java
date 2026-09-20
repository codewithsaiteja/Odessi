package com.odessi.api.service.impl;

import com.odessi.api.dto.request.CustomOrderRequest;
import com.odessi.api.dto.response.CustomOrderResponse;
import com.odessi.api.entity.CustomOrderInquiry;
import com.odessi.api.entity.CustomOrderStatus;
import com.odessi.api.entity.User;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.CustomOrderInquiryRepository;
import com.odessi.api.service.AdminAuditService;
import com.odessi.api.service.CustomOrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomOrderServiceImpl implements CustomOrderService {

    private final CustomOrderInquiryRepository repository;
    private final AdminAuditService auditService;

    public CustomOrderServiceImpl(CustomOrderInquiryRepository repository, AdminAuditService auditService) {
        this.repository = repository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public CustomOrderResponse submitInquiry(CustomOrderRequest request) {
        CustomOrderInquiry inquiry = new CustomOrderInquiry(
            request.name(),
            request.email(),
            request.phone(),
            request.organization(),
            request.orderType(),
            request.approximateQuantity(),
            request.preferredProduct(),
            request.customizationRequirement(),
            request.expectedDeliveryDate(),
            request.message()
        );

        CustomOrderInquiry saved = repository.save(inquiry);
        return toResponse(saved, false);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CustomOrderResponse> getInquiries(CustomOrderStatus status, String search, Pageable pageable) {
        Page<CustomOrderInquiry> page = (status != null)
            ? repository.findByStatus(status, pageable)
            : repository.findAll(pageable);

        return page.map(inquiry -> toResponse(inquiry, true));
    }

    @Override
    @Transactional(readOnly = true)
    public CustomOrderResponse getInquiryById(Long id) {
        CustomOrderInquiry inquiry = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CUSTOM_ORDER_NOT_FOUND", "Custom order inquiry not found: " + id));
        return toResponse(inquiry, true);
    }

    @Override
    @Transactional
    public CustomOrderResponse updateStatus(User admin, Long id, CustomOrderStatus newStatus) {
        CustomOrderInquiry inquiry = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CUSTOM_ORDER_NOT_FOUND", "Custom order inquiry not found: " + id));

        CustomOrderStatus oldStatus = inquiry.getStatus();
        if (oldStatus == newStatus) {
            return toResponse(inquiry, true);
        }

        inquiry.setStatus(newStatus);
        CustomOrderInquiry updated = repository.save(inquiry);

        auditService.logAction(admin, "CUSTOM_ORDER_STATUS_UPDATED", "CustomOrderInquiry", id.toString(),
            "Updated custom order status from " + oldStatus + " to " + newStatus);

        return toResponse(updated, true);
    }

    @Override
    @Transactional
    public CustomOrderResponse updateInternalNotes(User admin, Long id, String internalNotes) {
        CustomOrderInquiry inquiry = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("CUSTOM_ORDER_NOT_FOUND", "Custom order inquiry not found: " + id));

        inquiry.setInternalNotes(internalNotes);
        CustomOrderInquiry updated = repository.save(inquiry);

        auditService.logAction(admin, "CUSTOM_ORDER_NOTES_UPDATED", "CustomOrderInquiry", id.toString(),
            "Updated internal notes for custom order inquiry ID " + id);

        return toResponse(updated, true);
    }

    private CustomOrderResponse toResponse(CustomOrderInquiry inquiry, boolean includeInternalNotes) {
        return new CustomOrderResponse(
            inquiry.getId(),
            inquiry.getName(),
            inquiry.getEmail(),
            inquiry.getPhone(),
            inquiry.getOrganization(),
            inquiry.getOrderType(),
            inquiry.getApproximateQuantity(),
            inquiry.getPreferredProduct(),
            inquiry.getCustomizationRequirement(),
            inquiry.getExpectedDeliveryDate(),
            inquiry.getMessage(),
            inquiry.getStatus().name(),
            includeInternalNotes ? inquiry.getInternalNotes() : null,
            inquiry.getCreatedAt(),
            inquiry.getUpdatedAt()
        );
    }
}
