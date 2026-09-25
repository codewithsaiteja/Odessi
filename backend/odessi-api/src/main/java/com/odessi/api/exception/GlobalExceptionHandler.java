package com.odessi.api.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Centralised exception handling for all REST controllers.
 *
 * <p>All error responses follow a consistent shape:
 * <pre>
 * {
 *   "timestamp": "...",
 *   "status": 404,
 *   "error": "PRODUCT_NOT_FOUND",
 *   "message": "Product not found with slug: example",
 *   "path": "/api/products/example"
 * }
 * </pre>
 *
 * Stack traces and internal database details are NEVER exposed.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ── Resource not found (404) ──────────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        log.info("Resource not found: {} — {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.of(HttpStatus.NOT_FOUND, ex.getErrorCode(), ex.getMessage(), request.getRequestURI()));
    }

    // ── Bad Request Exception (400) ───────────────────────────────

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(
            BadRequestException ex, HttpServletRequest request) {
        log.info("Bad request: {} — {}", ex.getErrorCode(), ex.getMessage());
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(HttpStatus.BAD_REQUEST, ex.getErrorCode() != null ? ex.getErrorCode() : "BAD_REQUEST", ex.getMessage(), request.getRequestURI()));
    }

    // ── Business rule violation (422 / 401 for authentication) ────

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(
            BusinessException ex, HttpServletRequest request) {
        log.warn("Business rule violation: {} — {}", ex.getErrorCode(), ex.getMessage());

        // Map authentication credential and refresh token failures to 401 Unauthorized
        if ("INVALID_CREDENTIALS".equals(ex.getErrorCode())
                || "INVALID_REFRESH_TOKEN".equals(ex.getErrorCode())
                || "REFRESH_TOKEN_EXPIRED".equals(ex.getErrorCode())
                || "REFRESH_TOKEN_REUSE".equals(ex.getErrorCode())) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ErrorResponse.of(HttpStatus.UNAUTHORIZED, ex.getErrorCode(), ex.getMessage(), request.getRequestURI()));
        }

        return ResponseEntity
            .status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(ErrorResponse.of(HttpStatus.UNPROCESSABLE_ENTITY, ex.getErrorCode(), ex.getMessage(), request.getRequestURI()));
    }

    // ── Bean Validation failure (400) ─────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = error instanceof FieldError fe ? fe.getField() : error.getObjectName();
            errors.put(fieldName, error.getDefaultMessage());
        });
        log.debug("Validation failed: {}", errors);
        
        // Combine all error messages to return to client (do not hide the error)
        String combinedMessage = String.join(", ", errors.values());
        
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ValidationErrorResponse(
                Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                "VALIDATION_ERROR",
                combinedMessage,
                request.getRequestURI(),
                errors
            ));
    }

    // ── Type mismatch in path/query params (400) ──────────────────

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String message = String.format("Invalid value '%s' for parameter '%s'", ex.getValue(), ex.getName());
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(HttpStatus.BAD_REQUEST, "INVALID_PARAMETER", message, request.getRequestURI()));
    }

    // ── Unreadable HTTP message / JSON syntax error (400) ─────────

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableMessage(
            org.springframework.http.converter.HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Malformed HTTP request body at {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(HttpStatus.BAD_REQUEST, "BAD_REQUEST", "Malformed JSON request body", request.getRequestURI()));
    }

    // ── Access Denied (403) ──────────────────────────────────────
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            org.springframework.security.access.AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied at {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse.of(HttpStatus.FORBIDDEN, "FORBIDDEN", "Access denied. Admin role required.", request.getRequestURI()));
    }

    // ── Resource / Static Not Found (404) ────────────────────────
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(
            org.springframework.web.servlet.resource.NoResourceFoundException ex, HttpServletRequest request) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.of(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", ex.getMessage(), request.getRequestURI()));
    }

    // ── Multipart / Max Upload Size Exceeded (400) ───────────────
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceeded(
            org.springframework.web.multipart.MaxUploadSizeExceededException ex, HttpServletRequest request) {
        log.warn("File upload size exceeded at {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(HttpStatus.BAD_REQUEST, "FILE_TOO_LARGE", "Uploaded file exceeds the maximum allowed limit (50MB).", request.getRequestURI()));
    }

    @ExceptionHandler(org.springframework.web.multipart.MultipartException.class)
    public ResponseEntity<ErrorResponse> handleMultipartException(
            org.springframework.web.multipart.MultipartException ex, HttpServletRequest request) {
        log.warn("Multipart request error at {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.of(HttpStatus.BAD_REQUEST, "MULTIPART_ERROR", "Invalid file upload request: " + ex.getMessage(), request.getRequestURI()));
    }

    // ── Data Integrity Violation (409) ────────────────────────────
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            org.springframework.dao.DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Data integrity violation at {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(ErrorResponse.of(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION", "Database constraint violation occurred.", request.getRequestURI()));
    }

    // ── Client Transport Disconnect (Broken pipe / Client abort) ─────
    @ExceptionHandler(org.springframework.web.context.request.async.AsyncRequestNotUsableException.class)
    public void handleAsyncRequestNotUsable(
            org.springframework.web.context.request.async.AsyncRequestNotUsableException ex, HttpServletRequest request) {
        log.debug("Client disconnected before async request/stream completion at {}: {}", request.getRequestURI(), ex.getMessage());
    }

    // ── Unhandled exceptions (500) ────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
            Exception ex, HttpServletRequest request) {
        if (isClientDisconnectException(ex)) {
            log.debug("Client connection closed during response generation at {}: {}", request.getRequestURI(), ex.getMessage());
            return null; // Output stream is already broken; do not manufacture a 500 response
        }

        log.error("Unhandled exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        String msg = ex.getMessage() != null && !ex.getMessage().isBlank()
            ? ex.getMessage()
            : "An unexpected error occurred. Please try again later.";
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                msg,
                request.getRequestURI()));
    }

    private boolean isClientDisconnectException(Throwable throwable) {
        if (throwable == null) {
            return false;
        }
        String className = throwable.getClass().getName();
        String message = throwable.getMessage() != null ? throwable.getMessage().toLowerCase(java.util.Locale.ROOT) : "";

        if (className.contains("AsyncRequestNotUsableException")
                || className.contains("ClientAbortException")
                || (throwable instanceof java.io.IOException && (
                       message.contains("broken pipe")
                    || message.contains("connection reset")
                    || message.contains("connection abort")
                    || message.contains("an established connection was aborted")
                   ))) {
            return true;
        }

        Throwable cause = throwable.getCause();
        if (cause != null && cause != throwable) {
            return isClientDisconnectException(cause);
        }

        return false;
    }

    // ── Error response records ────────────────────────────────────

    public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
    ) {
        static ErrorResponse of(HttpStatus status, String error, String message, String path) {
            return new ErrorResponse(Instant.now(), status.value(), error, message, path);
        }
    }

    public record ValidationErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors
    ) {}
}
