package com.odessi.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.odessi.api.security.CustomUserDetailsService;
import com.odessi.api.security.JwtAuthenticationFilter;
import com.odessi.api.security.RateLimitingFilter;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration — Phase 8 Security Hardening.
 *
 * <p>Phase 8 adds:
 * <ul>
 *   <li>Composite rate-limiting filter (IP+endpoint for unauthenticated, userId+endpoint for authenticated paths).</li>
 *   <li>Modern security response headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
 *       Permissions-Policy, Content-Security-Policy, HSTS for HTTPS profiles).</li>
 *   <li>CORS credentials safety: allowed origins never include wildcard when credentials are enabled.</li>
 * </ul>
 */
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final AppProperties appProperties;
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final RateLimitingFilter rateLimitingFilter;
    private final CustomUserDetailsService userDetailsService;
    private final Environment environment;

    public SecurityConfig(
            AppProperties appProperties,
            JwtAuthenticationFilter jwtAuthFilter,
            RateLimitingFilter rateLimitingFilter,
            CustomUserDetailsService userDetailsService,
            Environment environment) {
        this.appProperties = appProperties;
        this.jwtAuthFilter = jwtAuthFilter;
        this.rateLimitingFilter = rateLimitingFilter;
        this.userDetailsService = userDetailsService;
        this.environment = environment;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        // Use default CSRF token handler
        CsrfTokenRequestAttributeHandler requestHandler = new CsrfTokenRequestAttributeHandler();
        requestHandler.setCsrfRequestAttributeName(null); // allow _csrf

        boolean isHttpsProfile = Arrays.asList(environment.getActiveProfiles()).contains("prod")
                || Arrays.asList(environment.getActiveProfiles()).contains("staging");

        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(requestHandler)
                .ignoringRequestMatchers(
                    "/api/auth/login", "/api/auth/register", "/api/auth/refresh",
                    "/api/auth/forgot-password", "/api/auth/reset-password",
                    "/api/webhooks/razorpay",
                    "/api/partnerships", "/api/custom-orders", "/api/back-in-stock/subscribe"
                ) // public POSTs + server-to-server webhook
            )
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // ── Modern Security Headers ─────────────────────────────────────────────
            .headers(headers -> headers
                // Prevent MIME-type sniffing
                .contentTypeOptions(ct -> {})
                // Prevent clickjacking — deny all frame embedding
                .frameOptions(fo -> fo.deny())
                // Referrer policy: send origin only on same-site, no referrer on cross-site downgrades
                .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                // HSTS — only in HTTPS environments; not set for local HTTP development
                .httpStrictTransportSecurity(hsts -> {
                    if (isHttpsProfile) {
                        hsts.includeSubDomains(true).maxAgeInSeconds(31536000);
                    } else {
                        hsts.disable();
                    }
                })
                // Content-Security-Policy — configured for Next.js, Google Fonts, Unsplash, and Razorpay
                .contentSecurityPolicy(csp -> csp.policyDirectives(buildCsp()))
                // Permissions-Policy — disable sensitive browser APIs not used by the application
                .permissionsPolicy(pp -> pp.policy("camera=(), microphone=(), geolocation=()"))
            )
            .authorizeHttpRequests(auth -> auth
                // ── Public endpoints ─────────────────────────────────────
                .requestMatchers(
                    "/api/products",
                    "/api/products/**",
                    "/api/categories",
                    "/api/categories/**",
                    "/api/collections",
                    "/api/collections/**",
                    "/uploads/**"
                ).permitAll()
                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/refresh",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password",
                    "/api/webhooks/razorpay",
                    "/api/partnerships",
                    "/api/custom-orders",
                    "/api/back-in-stock/subscribe"
                ).permitAll()
                // ── Health & documentation ───────────────────────────────────────────
                .requestMatchers(
                    "/api/health",
                    "/actuator/health",
                    "/actuator/info",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/api-docs/**",
                    "/v3/api-docs/**"
                ).permitAll()
                // ── Protected endpoints ──────────────────────────────────
                .requestMatchers("/api/cart/**").authenticated()
                .requestMatchers("/api/wishlist/**").authenticated()
                .requestMatchers("/api/addresses/**").authenticated()
                .requestMatchers("/api/orders/**").authenticated()
                .requestMatchers("/api/auth/me", "/api/auth/logout").authenticated()
                .requestMatchers("/api/users/me/**").authenticated()
                // ── Admin ────────────────────────────────────────────────
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // ── Anything else ────────────────────────────────────────
                .anyRequest().authenticated()
            )
            // Rate limiter runs before JWT authentication
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                // Return 401 (not 403) when the request is not authenticated.
                .authenticationEntryPoint((request, response, authException) ->
                    response.sendError(HttpStatus.UNAUTHORIZED.value(), "Unauthorized"))
            );

        return http.build();
    }

    /**
     * Builds the Content-Security-Policy directive string.
     *
     * <p>Based on actual application resource requirements:
     * <ul>
     *   <li>Next.js requires {@code 'unsafe-inline'} for inline scripts and styles.</li>
     *   <li>Google Fonts — only if used in the storefront (confirmed: Inter font from fonts.googleapis.com).</li>
     *   <li>Unsplash — product images (confirmed: images.unsplash.com, plus.unsplash.com).</li>
     *   <li>Razorpay Checkout — payment iframe and API calls.</li>
     *   <li>The backend API itself.</li>
     * </ul>
     */
    private String buildCsp() {
        return "default-src 'self'; " +
               // Scripts: self + Next.js inline scripts + Razorpay checkout script
               "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; " +
               // Styles: self + inline (Next.js CSS-in-JS) + Google Fonts
               "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
               // Fonts: self + Google Fonts CDN
               "font-src 'self' https://fonts.gstatic.com; " +
               // Images: self + data URIs + Unsplash product images
               "img-src 'self' data: https://images.unsplash.com https://plus.unsplash.com; " +
               // Connections: self (API) + Razorpay API
               "connect-src 'self' https://api.razorpay.com; " +
               // Frames: Razorpay payment iframe
               "frame-src https://api.razorpay.com https://checkout.razorpay.com; " +
               // Objects: none — no Flash/plugins
               "object-src 'none'; " +
               // Base URI restricted to self
               "base-uri 'self'; " +
               // Forms: self only
               "form-action 'self';";
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt with strength 12 — production-ready
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Read from environment — never wildcard for authenticated APIs
        String allowedOrigins = appProperties.getCors().getAllowedOrigins();
        List<String> origins = Arrays.asList(allowedOrigins.split(","));

        // Safety guard: credentials+wildcard is a security violation — reject it
        boolean hasWildcard = origins.stream().anyMatch(o -> o.trim().equals("*"));
        if (hasWildcard) {
            throw new IllegalStateException(
                "SECURITY VIOLATION: CORS allowedOrigins must not contain '*' when credentials are enabled. " +
                "Set app.cors.allowed-origins to explicit origins.");
        }

        config.setAllowedOrigins(origins.stream().map(String::trim).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("X-Total-Count", "X-Page", "X-Page-Size"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        source.registerCorsConfiguration("/uploads/**", config);
        return source;
    }
}
