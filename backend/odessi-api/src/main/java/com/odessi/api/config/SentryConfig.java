package com.odessi.api.config;

import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.ResourceNotFoundException;
import io.sentry.Hint;
import io.sentry.SentryEvent;
import io.sentry.SentryOptions;
import io.sentry.protocol.Request;
import io.sentry.protocol.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Sentry Error Monitoring Configuration — Odessi Spring Boot Backend.
 *
 * <p>Configured for organization {@code odessi}, project {@code odessi-backend}.
 *
 * <p>Key Responsibilities:
 * <ul>
 *   <li><b>Data Scrubbing &amp; PII Protection:</b> Strips sensitive headers (Authorization, Cookie,
 *       Set-Cookie, X-XSRF-TOKEN, Razorpay signatures, API keys), redacts cookies, and removes
 *       IP addresses and emails from user contexts before events leave the JVM.</li>
 *   <li><b>Exception Filtering:</b> Drops expected client-side 4xx errors (e.g. 404 Not Found,
 *       400 Validation, 403 Forbidden, 422 Business violations) so Sentry alerts reflect genuine
 *       server crashes, database constraint failures, and unhandled 5xx exceptions.</li>
 *   <li><b>Duplicate Prevention:</b> Works seamlessly with Spring Boot's SentryExceptionResolver;
 *       no manual Sentry.captureException calls required in controller advice.</li>
 * </ul>
 */
@Configuration
public class SentryConfig {

    private static final Logger log = LoggerFactory.getLogger(SentryConfig.class);

    private static final String REDACTED = "[REDACTED]";

    private static final Set<String> SENSITIVE_HEADERS = Set.of(
            "authorization",
            "proxy-authorization",
            "cookie",
            "set-cookie",
            "x-xsrf-token",
            "x-csrf-token",
            "x-razorpay-signature",
            "api-key",
            "apikey",
            "key",
            "secret",
            "password"
    );

    @Bean
    public SentryOptions.BeforeSendCallback sentryBeforeSendCallback() {
        return this::processEvent;
    }

    /**
     * Inspects, filters, and sanitizes each SentryEvent before transmission.
     *
     * @param event SentryEvent prepared by the Sentry SDK
     * @param hint  context hint
     * @return sanitized SentryEvent to send, or {@code null} to drop the event
     */
    public SentryEvent processEvent(SentryEvent event, Hint hint) {
        if (event == null) {
            return null;
        }

        Throwable throwable = event.getThrowable();

        // 1. Filter out expected client-side 4xx errors
        if (throwable != null && isExpectedClientException(throwable)) {
            log.trace("Dropping expected client error from Sentry: {}", throwable.getClass().getSimpleName());
            return null;
        }

        // 2. Scrub sensitive data from the HTTP request context
        Request request = event.getRequest();
        if (request != null) {
            sanitizeRequest(request);
        }

        // 3. Scrub user PII (IP address, email)
        User user = event.getUser();
        if (user != null) {
            user.setIpAddress(null);
            user.setEmail(null);
        }

        return event;
    }

    /**
     * Determines whether an exception is an expected client-side error (4xx)
     * that should not trigger a Sentry error alert.
     */
    public boolean isExpectedClientException(Throwable throwable) {
        if (throwable == null) {
            return false;
        }

        if (throwable instanceof ResourceNotFoundException
                || throwable instanceof NoResourceFoundException
                || throwable instanceof BadRequestException
                || throwable instanceof BusinessException
                || throwable instanceof MethodArgumentNotValidException
                || throwable instanceof MethodArgumentTypeMismatchException
                || throwable instanceof HttpMessageNotReadableException
                || throwable instanceof MaxUploadSizeExceededException
                || throwable instanceof MultipartException
                || throwable instanceof AccessDeniedException) {
            return true;
        }

        // Inspect causes in case the client exception was wrapped
        Throwable cause = throwable.getCause();
        if (cause != null && cause != throwable) {
            return isExpectedClientException(cause);
        }

        return false;
    }

    /**
     * Redacts sensitive headers and cookies from the captured request.
     */
    private void sanitizeRequest(Request request) {
        Map<String, String> headers = request.getHeaders();
        if (headers != null && !headers.isEmpty()) {
            Map<String, String> sanitizedHeaders = new HashMap<>();
            for (Map.Entry<String, String> entry : headers.entrySet()) {
                String key = entry.getKey();
                if (key != null && SENSITIVE_HEADERS.contains(key.toLowerCase(Locale.ROOT))) {
                    sanitizedHeaders.put(key, REDACTED);
                } else {
                    sanitizedHeaders.put(key, entry.getValue());
                }
            }
            request.setHeaders(sanitizedHeaders);
        }

        if (request.getCookies() != null) {
            request.setCookies(REDACTED);
        }
    }
}
