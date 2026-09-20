package com.odessi.api.service;

import com.odessi.api.dto.request.PartnershipRequest;
import com.odessi.api.dto.response.PartnershipResponse;
import com.odessi.api.entity.PartnershipStatus;
import com.odessi.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PartnershipService {
    PartnershipResponse submitApplication(PartnershipRequest request);
    Page<PartnershipResponse> getApplications(PartnershipStatus status, String search, Pageable pageable);
    PartnershipResponse getApplicationById(Long id);
    PartnershipResponse updateStatus(User admin, Long id, PartnershipStatus newStatus);
    PartnershipResponse updateInternalNotes(User admin, Long id, String internalNotes);
}
