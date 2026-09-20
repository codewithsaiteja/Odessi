package com.odessi.api.dto.response;

import java.util.List;

/**
 * Generic paginated API response wrapper.
 * Maps to the frontend PaginatedResponse<T> type.
 */
public record PagedResponse<T>(
    List<T> data,
    int page,
    int pageSize,
    long total,
    int totalPages,
    boolean hasNext,
    boolean hasPrevious
) {
    public static <T> PagedResponse<T> of(
            List<T> data,
            int page,
            int pageSize,
            long total) {
        int totalPages = pageSize == 0 ? 1 : (int) Math.ceil((double) total / pageSize);
        return new PagedResponse<>(
            data,
            page,
            pageSize,
            total,
            totalPages,
            page < totalPages - 1,
            page > 0
        );
    }
}
