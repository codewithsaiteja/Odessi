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

    // ── Business rule violation (422) ─────────────────────────────

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(
            BusinessException ex, HttpServletRequest request) {
        log.warn("Business rule violation: {} — {}", ex.getErrorCode(), ex.getMessage());
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

    // ── Unhandled exceptions (500) ────────────────────────────────

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
            Exception ex, HttpServletRequest request) {
        // Log full details server-side but expose nothing to the client
        log.error("Unhandled exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_ERROR",
                "An unexpected error occurred. Please try again later.",
                request.getRequestURI()));
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
