package com.odessi.api.dto.admin;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record AdminBulkProductRequest(
    @NotEmpty(message = "At least one product ID must be specified")
    List<Long> productIds,

    @NotNull(message = "Action is required")
    String action, // PUBLISH, HIDE, ARCHIVE, DRAFT, FEATURE, UNFEATURE, ASSIGN_COLLECTION

    Long collectionId
) {}
