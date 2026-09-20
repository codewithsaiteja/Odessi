package com.odessi.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Typed configuration properties bound from application.yml under the "app" prefix.
 */
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Cors cors = new Cors();
    private Pagination pagination = new Pagination();
    private Seed seed = new Seed();
    private Auth auth = new Auth();
    private Razorpay razorpay = new Razorpay();
    private Checkout checkout = new Checkout();
    private RateLimit rateLimit = new RateLimit();

    public Auth getAuth() { return auth; }
    public void setAuth(Auth auth) { this.auth = auth; }

    public Cors getCors() { return cors; }
    public void setCors(Cors cors) { this.cors = cors; }

    public Pagination getPagination() { return pagination; }
    public void setPagination(Pagination pagination) { this.pagination = pagination; }

    public Seed getSeed() { return seed; }
    public void setSeed(Seed seed) { this.seed = seed; }

    public Razorpay getRazorpay() { return razorpay; }
    public void setRazorpay(Razorpay razorpay) { this.razorpay = razorpay; }

    public Checkout getCheckout() { return checkout; }
    public void setCheckout(Checkout checkout) { this.checkout = checkout; }

    public RateLimit getRateLimit() { return rateLimit; }
    public void setRateLimit(RateLimit rateLimit) { this.rateLimit = rateLimit; }

    public static class Cors {
        private String allowedOrigins = "http://localhost:3000";

        public String getAllowedOrigins() { return allowedOrigins; }
        public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }
    }

    public static class Pagination {
        private int defaultPageSize = 20;
        private int maxPageSize = 100;

        public int getDefaultPageSize() { return defaultPageSize; }
        public void setDefaultPageSize(int defaultPageSize) { this.defaultPageSize = defaultPageSize; }

        public int getMaxPageSize() { return maxPageSize; }
        public void setMaxPageSize(int maxPageSize) { this.maxPageSize = maxPageSize; }
    }

    public static class Seed {
        private boolean enabled = true;

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
    }

    public static class Auth {
        private String jwtSecret;
        private long jwtAccessExpiration = 900000;
        private long jwtRefreshExpiration = 604800000;
        private boolean cookieSecure = false;
        private String cookieSameSite = "Lax";
        private boolean requireEmailVerification = false;

        public String getJwtSecret() { return jwtSecret; }
        public void setJwtSecret(String jwtSecret) { this.jwtSecret = jwtSecret; }

        public long getJwtAccessExpiration() { return jwtAccessExpiration; }
        public void setJwtAccessExpiration(long jwtAccessExpiration) { this.jwtAccessExpiration = jwtAccessExpiration; }

        public long getJwtRefreshExpiration() { return jwtRefreshExpiration; }
        public void setJwtRefreshExpiration(long jwtRefreshExpiration) { this.jwtRefreshExpiration = jwtRefreshExpiration; }

        public boolean isCookieSecure() { return cookieSecure; }
        public void setCookieSecure(boolean cookieSecure) { this.cookieSecure = cookieSecure; }

        public String getCookieSameSite() { return cookieSameSite; }
        public void setCookieSameSite(String cookieSameSite) { this.cookieSameSite = cookieSameSite; }

        public boolean isRequireEmailVerification() { return requireEmailVerification; }
        public void setRequireEmailVerification(boolean requireEmailVerification) { this.requireEmailVerification = requireEmailVerification; }
    }

    public static class Razorpay {
        private String keyId = "rzp_test_dummykeyid123";
        private String keySecret = "dummysecretkey1234567890";
        private String webhookSecret = "dummywebhooksecret1234567890";

        public String getKeyId() { return keyId; }
        public void setKeyId(String keyId) { this.keyId = keyId; }

        public String getKeySecret() { return keySecret; }
        public void setKeySecret(String keySecret) { this.keySecret = keySecret; }

        public String getWebhookSecret() { return webhookSecret; }
        public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }
    }

    public static class Checkout {
        private int reservationExpirationMinutes = 15;
        private String scheduledCleanupCron = "0 */5 * * * *";

        public int getReservationExpirationMinutes() { return reservationExpirationMinutes; }
        public void setReservationExpirationMinutes(int reservationExpirationMinutes) { this.reservationExpirationMinutes = reservationExpirationMinutes; }

        public String getScheduledCleanupCron() { return scheduledCleanupCron; }
        public void setScheduledCleanupCron(String scheduledCleanupCron) { this.scheduledCleanupCron = scheduledCleanupCron; }
    }

    /**
     * Rate limiting configuration.
     *
     * <p>Two tiers:
     * <ul>
     *   <li><b>Unauthenticated</b>: keyed by IP + endpoint path (login, register, forgot/reset password, refresh).</li>
     *   <li><b>Authenticated</b>: keyed by userId + endpoint path (coupon validation, etc.).</li>
     * </ul>
     *
     * <p>NOTE: In-memory implementation is used in Phase 8. Multi-instance production clusters
     * require shared/distributed state (e.g. Redis). No external dependency is introduced here.
     */
    public static class RateLimit {
        /** Maximum requests per window for unauthenticated paths (IP + endpoint key). */
        private int unauthMaxRequests = 10;
        /** Time window in seconds for unauthenticated paths. */
        private int unauthWindowSeconds = 60;
        /** Maximum requests per window for authenticated paths (userId + endpoint key). */
        private int authMaxRequests = 30;
        /** Time window in seconds for authenticated paths. */
        private int authWindowSeconds = 60;

        public int getUnauthMaxRequests() { return unauthMaxRequests; }
        public void setUnauthMaxRequests(int unauthMaxRequests) { this.unauthMaxRequests = unauthMaxRequests; }

        public int getUnauthWindowSeconds() { return unauthWindowSeconds; }
        public void setUnauthWindowSeconds(int unauthWindowSeconds) { this.unauthWindowSeconds = unauthWindowSeconds; }

        public int getAuthMaxRequests() { return authMaxRequests; }
        public void setAuthMaxRequests(int authMaxRequests) { this.authMaxRequests = authMaxRequests; }

        public int getAuthWindowSeconds() { return authWindowSeconds; }
        public void setAuthWindowSeconds(int authWindowSeconds) { this.authWindowSeconds = authWindowSeconds; }
    }
}
