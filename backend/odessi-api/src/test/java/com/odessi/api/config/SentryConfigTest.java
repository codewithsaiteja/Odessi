package com.odessi.api.config;

import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.ResourceNotFoundException;
import io.sentry.Hint;
import io.sentry.SentryEvent;
import io.sentry.protocol.Request;
import io.sentry.protocol.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SentryConfig — BeforeSendCallback & Security Scrubbing")
class SentryConfigTest {

    private SentryConfig sentryConfig;

    @BeforeEach
    void setUp() {
        sentryConfig = new SentryConfig();
    }

    @Nested
    @DisplayName("Exception Filtering (Client 4xx vs Server 5xx)")
    class ExceptionFilteringTests {

        @Test
        @DisplayName("Should drop ResourceNotFoundException (404)")
        void shouldDropResourceNotFound() {
            SentryEvent event = new SentryEvent(new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found"));
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should drop BadRequestException (400)")
        void shouldDropBadRequest() {
            SentryEvent event = new SentryEvent(new BadRequestException("INVALID_INPUT", "Bad request"));
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should drop BusinessException (422)")
        void shouldDropBusinessException() {
            SentryEvent event = new SentryEvent(new BusinessException("INSUFFICIENT_STOCK", "Item out of stock"));
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should drop AccessDeniedException (403)")
        void shouldDropAccessDenied() {
            SentryEvent event = new SentryEvent(new AccessDeniedException("Access denied"));
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should drop HttpMessageNotReadableException (400)")
        void shouldDropMalformedJson() {
            SentryEvent event = new SentryEvent(new HttpMessageNotReadableException("Malformed JSON"));
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should drop MaxUploadSizeExceededException (400)")
        void shouldDropUploadSizeExceeded() {
            SentryEvent event = new SentryEvent(new MaxUploadSizeExceededException(50_000_000));
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should drop MultipartException (400)")
        void shouldDropMultipartException() {
            SentryEvent event = new SentryEvent(new MultipartException("Invalid multipart"));
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should drop wrapped client exception")
        void shouldDropWrappedClientException() {
            RuntimeException wrapper = new RuntimeException("Wrapped", new ResourceNotFoundException("NOT_FOUND", "Not found"));
            SentryEvent event = new SentryEvent(wrapper);
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNull();
        }

        @Test
        @DisplayName("Should RETAIN unexpected 5xx RuntimeException")
        void shouldRetainUnexpectedRuntimeException() {
            SentryEvent event = new SentryEvent(new RuntimeException("Database connection timeout"));
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNotNull();
            assertThat(result.getThrowable()).isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("Should RETAIN NullPointerException (server crash)")
        void shouldRetainNullPointerException() {
            SentryEvent event = new SentryEvent(new NullPointerException("Null reference"));
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("Should RETAIN DataIntegrityViolationException (database constraint issue)")
        void shouldRetainDataIntegrityViolation() {
            SentryEvent event = new SentryEvent(new DataIntegrityViolationException("Unique key constraint"));
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("Should RETAIN event without throwable (e.g. logged server errors)")
        void shouldRetainEventWithoutThrowable() {
            SentryEvent event = new SentryEvent();
            SentryEvent result = sentryConfig.processEvent(event, new Hint());
            assertThat(result).isNotNull();
        }
    }

    @Nested
    @DisplayName("PII and Sensitive Data Scrubbing")
    class DataScrubbingTests {

        @Test
        @DisplayName("Should redact Authorization, Cookie, and CSRF headers while preserving standard headers")
        void shouldRedactSensitiveHeaders() {
            SentryEvent event = new SentryEvent(new RuntimeException("Server error"));
            Request request = new Request();

            Map<String, String> headers = new HashMap<>();
            headers.put("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret");
            headers.put("Cookie", "access_token=abc123secret; JSESSIONID=def456");
            headers.put("Set-Cookie", "access_token=abc123secret");
            headers.put("X-XSRF-TOKEN", "csrf_token_value_here");
            headers.put("X-CSRF-TOKEN", "csrf_token_value_here");
            headers.put("X-Razorpay-Signature", "razorpay_sig_123");
            headers.put("Api-Key", "my_api_key");
            headers.put("User-Agent", "Mozilla/5.0 Chrome/120.0");
            headers.put("Accept", "application/json");

            request.setHeaders(headers);
            event.setRequest(request);

            SentryEvent result = sentryConfig.processEvent(event, new Hint());

            assertThat(result).isNotNull();
            Map<String, String> sanitized = result.getRequest().getHeaders();

            assertThat(sanitized.get("Authorization")).isEqualTo("[REDACTED]");
            assertThat(sanitized.get("Cookie")).isEqualTo("[REDACTED]");
            assertThat(sanitized.get("Set-Cookie")).isEqualTo("[REDACTED]");
            assertThat(sanitized.get("X-XSRF-TOKEN")).isEqualTo("[REDACTED]");
            assertThat(sanitized.get("X-CSRF-TOKEN")).isEqualTo("[REDACTED]");
            assertThat(sanitized.get("X-Razorpay-Signature")).isEqualTo("[REDACTED]");
            assertThat(sanitized.get("Api-Key")).isEqualTo("[REDACTED]");
            // Non-sensitive headers preserved
            assertThat(sanitized.get("User-Agent")).isEqualTo("Mozilla/5.0 Chrome/120.0");
            assertThat(sanitized.get("Accept")).isEqualTo("application/json");
        }

        @Test
        @DisplayName("Should redact request cookies string")
        void shouldRedactCookiesString() {
            SentryEvent event = new SentryEvent(new RuntimeException("Server error"));
            Request request = new Request();
            request.setCookies("access_token=secret_jwt; refresh_token=secret_refresh");
            event.setRequest(request);

            SentryEvent result = sentryConfig.processEvent(event, new Hint());

            assertThat(result).isNotNull();
            assertThat(result.getRequest().getCookies()).isEqualTo("[REDACTED]");
        }

        @Test
        @DisplayName("Should scrub user IP address and email")
        void shouldScrubUserPii() {
            SentryEvent event = new SentryEvent(new RuntimeException("Server error"));
            User user = new User();
            user.setId("usr-123");
            user.setUsername("customer");
            user.setIpAddress("203.0.113.195");
            user.setEmail("customer@odessi.shop");
            event.setUser(user);

            SentryEvent result = sentryConfig.processEvent(event, new Hint());

            assertThat(result).isNotNull();
            assertThat(result.getUser().getIpAddress()).isNull();
            assertThat(result.getUser().getEmail()).isNull();
            // Non-sensitive user ID is preserved for error grouping
            assertThat(result.getUser().getId()).isEqualTo("usr-123");
        }

        @Test
        @DisplayName("Should safely handle null event, null request, and null user")
        void shouldHandleNullStructuresSafely() {
            assertThat(sentryConfig.processEvent(null, new Hint())).isNull();

            SentryEvent eventNoRequest = new SentryEvent(new RuntimeException("Error"));
            assertThat(sentryConfig.processEvent(eventNoRequest, new Hint())).isNotNull();

            SentryEvent eventEmptyRequest = new SentryEvent(new RuntimeException("Error"));
            eventEmptyRequest.setRequest(new Request());
            assertThat(sentryConfig.processEvent(eventEmptyRequest, new Hint())).isNotNull();
        }
    }
}
