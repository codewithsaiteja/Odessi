package com.odessi.api.dto.response;

/**
 * Standard single-item API response envelope.
 */
public record ApiResponse<T>(
    T data,
    String message,
    boolean success
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null, true);
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(data, message, true);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(data, "Created successfully", true);
    }
}
