package com.odessi.api.dto.response;

import java.time.Instant;
import java.util.List;

public record WishlistResponse(
    Long id,
    Long userId,
    List<WishlistItemResponse> items,
    int itemCount,
    Instant updatedAt
) {}
