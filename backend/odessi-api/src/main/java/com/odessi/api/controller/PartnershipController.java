package com.odessi.api.controller;

import com.odessi.api.dto.request.PartnershipRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.PartnershipResponse;
import com.odessi.api.service.PartnershipService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/partnerships")
public class PartnershipController {

    private final PartnershipService partnershipService;

    public PartnershipController(PartnershipService partnershipService) {
        this.partnershipService = partnershipService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PartnershipResponse>> submitApplication(@Valid @RequestBody PartnershipRequest request) {
        PartnershipResponse response = partnershipService.submitApplication(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(response));
    }
}
