package com.odessi.api.service;

import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.ChangePasswordRequest;
import com.odessi.api.dto.request.ForgotPasswordRequest;
import com.odessi.api.dto.request.LoginRequest;
import com.odessi.api.dto.request.RegisterRequest;
import com.odessi.api.dto.request.ResetPasswordRequest;
import com.odessi.api.dto.response.UserResponse;
import com.odessi.api.dto.request.VerifyResetOtpRequest;
import com.odessi.api.dto.response.VerifyResetOtpResponse;
import com.odessi.api.entity.EmailVerificationToken;
import com.odessi.api.entity.PasswordResetOtpChallenge;
import com.odessi.api.entity.PasswordResetToken;
import com.odessi.api.entity.RefreshToken;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.EmailVerificationTokenRepository;
import com.odessi.api.repository.PasswordResetOtpChallengeRepository;
import com.odessi.api.repository.PasswordResetTokenRepository;
import com.odessi.api.repository.RefreshTokenRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordResetOtpChallengeRepository passwordResetOtpChallengeRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final ReferralService referralService;
    private final AppProperties appProperties;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordResetOtpChallengeRepository passwordResetOtpChallengeRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailService emailService,
            ReferralService referralService,
            AppProperties appProperties) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordResetOtpChallengeRepository = passwordResetOtpChallengeRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.referralService = referralService;
        this.appProperties = appProperties;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase().trim())) {
            throw new BusinessException("DUPLICATE_EMAIL", "An account with this email already exists");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setRole(Role.CUSTOMER);
        
        // If require-email-verification is false, auto-verify for development
        user.setEmailVerified(!appProperties.getAuth().isRequireEmailVerification());
        user.setEnabled(true);

        User savedUser = userRepository.save(user);

        // Customer referral program is discontinued; ignore any referral code provided
        if (request.getReferralCode() != null && !request.getReferralCode().isBlank()) {
            log.info("Customer referral program discontinued — ignoring referral code '{}' for user id={}",
                request.getReferralCode(), savedUser.getId());
        }

        if (!savedUser.isEmailVerified()) {
            generateAndSendVerificationEmail(savedUser);
        }

        return mapToUserResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public User authenticate(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new BusinessException("INVALID_CREDENTIALS", "Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException("INVALID_CREDENTIALS", "Invalid email or password");
        }

        if (!user.isEnabled()) {
            throw new BusinessException("ACCOUNT_DISABLED", "Account is disabled. Please contact support.");
        }

        if (appProperties.getAuth().isRequireEmailVerification() && !user.isEmailVerified()) {
            throw new BusinessException("EMAIL_NOT_VERIFIED", "Please verify your email address before logging in");
        }

        return user;
    }

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(UUID.randomUUID().toString()); // Secure random string
        Instant now = Instant.now();
        refreshToken.setCreatedAt(now);
        refreshToken.setLastActivityAt(now);
        long maxLifetimeMillis = (long) appProperties.getSession().getAbsoluteSessionLifetimeDays() * 24 * 60 * 60 * 1000L;
        refreshToken.setExpiresAt(now.plusMillis(maxLifetimeMillis));
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken createRotatedRefreshToken(User user, Instant originalExpiresAt) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(UUID.randomUUID().toString());
        Instant now = Instant.now();
        refreshToken.setCreatedAt(now);
        refreshToken.setLastActivityAt(now);
        // Retain absolute maximum lifetime of the original session
        refreshToken.setExpiresAt(originalExpiresAt != null ? originalExpiresAt : now.plusMillis(
            (long) appProperties.getSession().getAbsoluteSessionLifetimeDays() * 24 * 60 * 60 * 1000L
        ));
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void revokeRefreshToken(String token) {
        refreshTokenRepository.findByTokenHash(token).ifPresent(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }
    
    @Transactional
    public void revokeAllUserRefreshTokens(User user) {
        refreshTokenRepository.revokeAllByUser(user);
    }

    public record TokenRefreshResult(
        String accessToken,
        String refreshTokenHash
    ) {}

    public record SessionStatusResponse(
        boolean active,
        String role,
        long idleTimeoutSeconds,
        long remainingSeconds,
        long warningThresholdSeconds
    ) {}

    /**
     * Atomically verifies, rotates, and issues new tokens within a single transactional boundary.
     * Guaranteed to load full user entity to avoid any Hibernate proxy LazyInitializationException.
     */
    @Transactional
    public TokenRefreshResult rotateRefreshToken(String token) {
        RefreshToken oldToken = verifyAndRotateRefreshToken(token);
        // Explicitly load the user inside transaction boundary to avoid lazy proxy issues
        User user = userRepository.findById(oldToken.getUser().getId())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User associated with session not found"));
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String newJwt = jwtService.generateToken(userDetails);
        RefreshToken newRefreshToken = createRotatedRefreshToken(user, oldToken.getExpiresAt());
        return new TokenRefreshResult(newJwt, newRefreshToken.getTokenHash());
    }

    @Transactional
    public RefreshToken verifyAndRotateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHashWithUser(token)
                .or(() -> refreshTokenRepository.findByTokenHash(token))
                .orElseThrow(() -> new BusinessException("INVALID_REFRESH_TOKEN", "Refresh token is invalid"));

        User user = userRepository.findById(refreshToken.getUser().getId())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User associated with token not found"));

        if (refreshToken.isRevoked()) {
            refreshTokenRepository.revokeAllByUser(user);
            throw new BusinessException("REFRESH_TOKEN_REUSE", "Security violation: refresh token reuse detected. All sessions have been invalidated.");
        }

        Instant now = Instant.now();

        // 1. Absolute session lifetime enforcement
        if (refreshToken.getExpiresAt().isBefore(now)) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new BusinessException("REFRESH_TOKEN_EXPIRED", "Refresh token has expired. Please log in again.");
        }

        // 2. Server-authoritative idle timeout enforcement
        boolean isAdmin = user.getRole() == Role.ADMIN;
        int idleTimeoutMinutes = isAdmin
                ? appProperties.getSession().getAdminIdleTimeoutMinutes()
                : appProperties.getSession().getCustomerIdleTimeoutMinutes();

        Instant lastActive = refreshToken.getLastActivityAt() != null
                ? refreshToken.getLastActivityAt()
                : (refreshToken.getLastUsedAt() != null ? refreshToken.getLastUsedAt() : refreshToken.getCreatedAt());

        if (lastActive != null && now.isAfter(lastActive.plus(idleTimeoutMinutes, ChronoUnit.MINUTES))) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new BusinessException("SESSION_IDLE_TIMEOUT", "Session expired due to inactivity (" + idleTimeoutMinutes + " minutes). Please log in again.");
        }

        // Ensure user is eagerly attached so callers accessing oldToken.getUser() never hit LazyInitializationException
        refreshToken.setUser(user);
        refreshToken.setRevoked(true);
        refreshToken.setLastUsedAt(now);
        refreshToken.setLastActivityAt(now);
        refreshTokenRepository.save(refreshToken);

        return refreshToken;
    }

    /**
     * Extends the session's lastActivityAt timestamp if valid and unexpired.
     */
    @Transactional
    public SessionStatusResponse extendSession(String token) {
        if (token == null || token.isBlank()) {
            throw new BusinessException("NOT_AUTHENTICATED", "No active session token");
        }
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHashWithUser(token)
                .or(() -> refreshTokenRepository.findByTokenHash(token))
                .orElseThrow(() -> new BusinessException("INVALID_REFRESH_TOKEN", "Session not found"));

        User user = userRepository.findById(refreshToken.getUser().getId())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "User not found"));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("SESSION_EXPIRED", "Session expired. Please log in again.");
        }

        Instant now = Instant.now();
        boolean isAdmin = user.getRole() == Role.ADMIN;
        int idleTimeoutMinutes = isAdmin
                ? appProperties.getSession().getAdminIdleTimeoutMinutes()
                : appProperties.getSession().getCustomerIdleTimeoutMinutes();

        Instant lastActive = refreshToken.getLastActivityAt() != null
                ? refreshToken.getLastActivityAt()
                : (refreshToken.getLastUsedAt() != null ? refreshToken.getLastUsedAt() : refreshToken.getCreatedAt());

        if (lastActive != null && now.isAfter(lastActive.plus(idleTimeoutMinutes, ChronoUnit.MINUTES))) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new BusinessException("SESSION_IDLE_TIMEOUT", "Session expired due to inactivity. Please log in again.");
        }

        refreshToken.setLastActivityAt(now);
        refreshTokenRepository.save(refreshToken);

        long idleSeconds = idleTimeoutMinutes * 60L;
        return new SessionStatusResponse(
            true,
            user.getRole().name(),
            idleSeconds,
            idleSeconds,
            120L // 2 minute warning threshold
        );
    }

    /**
     * Authoritatively calculates remaining idle seconds for active session.
     */
    @Transactional(readOnly = true)
    public SessionStatusResponse getSessionStatus(User user, String token) {
        if (token == null || token.isBlank()) {
            throw new BusinessException("NOT_AUTHENTICATED", "No active session token");
        }
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHashWithUser(token)
                .or(() -> refreshTokenRepository.findByTokenHash(token))
                .orElseThrow(() -> new BusinessException("INVALID_REFRESH_TOKEN", "Session not found"));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            return new SessionStatusResponse(false, user.getRole().name(), 0, 0, 120L);
        }

        boolean isAdmin = user.getRole() == Role.ADMIN;
        int idleTimeoutMinutes = isAdmin
                ? appProperties.getSession().getAdminIdleTimeoutMinutes()
                : appProperties.getSession().getCustomerIdleTimeoutMinutes();

        Instant now = Instant.now();
        Instant lastActive = refreshToken.getLastActivityAt() != null
                ? refreshToken.getLastActivityAt()
                : (refreshToken.getLastUsedAt() != null ? refreshToken.getLastUsedAt() : refreshToken.getCreatedAt());

        long elapsedSeconds = Duration.between(lastActive, now).getSeconds();
        long totalSeconds = idleTimeoutMinutes * 60L;
        long remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

        return new SessionStatusResponse(
            remainingSeconds > 0,
            user.getRole().name(),
            totalSeconds,
            remainingSeconds,
            120L
        );
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        requestPasswordResetOtp(request.getEmail(), null);
    }

    /**
     * Step 1: Generates and dispatches a cryptographically secure 6-digit OTP to the user's email.
     * Enforces a 60-second cooldown per account and protects against timing enumeration attacks.
     */
    @Transactional
    public void requestPasswordResetOtp(String rawEmail, String ipAddress) {
        if (rawEmail == null || rawEmail.isBlank()) {
            return;
        }
        String normalizedEmail = rawEmail.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty()) {
            // Constant-time defense against timing attacks for user enumeration
            hashOtp("123456", generateSalt());
            log.info("Password reset OTP requested for unregistered email: {}", normalizedEmail);
            return;
        }

        User user = userOpt.get();

        // 60-second cooldown check
        Optional<PasswordResetOtpChallenge> lastChallenge =
                passwordResetOtpChallengeRepository.findFirstByUserOrderByCreatedAtDesc(user);
        if (lastChallenge.isPresent() && lastChallenge.get().getCreatedAt() != null) {
            Instant cooldownThreshold = Instant.now().minusSeconds(60);
            if (lastChallenge.get().getCreatedAt().isAfter(cooldownThreshold)) {
                throw new BusinessException("RATE_LIMIT_EXCEEDED", "Please wait 60 seconds before requesting another code.");
            }
        }

        // Invalidate previous challenges
        passwordResetOtpChallengeRepository.supersedeActiveChallengesForUser(user);

        // Generate cryptographically secure 6-digit OTP and 16-byte salt
        String otp = generateOtp();
        String salt = generateSalt();
        String otpHash = hashOtp(otp, salt);

        PasswordResetOtpChallenge challenge = new PasswordResetOtpChallenge();
        challenge.setUser(user);
        challenge.setEmail(user.getEmail());
        challenge.setOtpHash(otpHash);
        challenge.setOtpSalt(salt);
        challenge.setFailedAttempts(0);
        challenge.setMaxAttempts(5);
        challenge.setOtpExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));
        challenge.setVerified(false);
        challenge.setConsumed(false);
        challenge.setSuperseded(false);
        challenge.setIpAddress(ipAddress);

        passwordResetOtpChallengeRepository.save(challenge);

        try {
            emailService.sendPasswordResetOtpEmail(user.getEmail(), otp, 5);
            log.info("Password reset OTP email sent successfully for user id={}", user.getId());
        } catch (Exception e) {
            log.error("Failed to send password reset OTP email to user id={}: {}", user.getId(), e.getMessage());
        }
    }

    /**
     * Step 2: Verifies the 6-digit OTP with max 5 failed attempts and constant-time comparison.
     * On success, issues a single-use 10-minute reset authorization token.
     */
    @Transactional
    public VerifyResetOtpResponse verifyPasswordResetOtp(VerifyResetOtpRequest request, String ipAddress) {
        String normalizedEmail = request.email() != null ? request.email().trim().toLowerCase() : "";
        String rawOtp = request.otp() != null ? request.otp().trim() : "";

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            // Constant-time defense
            hashOtp(rawOtp, generateSalt());
            throw new BusinessException("INVALID_OTP", "Invalid or expired verification code.");
        }

        User user = userOpt.get();
        Optional<PasswordResetOtpChallenge> challengeOpt =
                passwordResetOtpChallengeRepository.findFirstByUserAndSupersededFalseAndConsumedFalseOrderByCreatedAtDesc(user);

        if (challengeOpt.isEmpty()) {
            throw new BusinessException("INVALID_OTP", "Invalid or expired verification code. Please request a new code.");
        }

        PasswordResetOtpChallenge challenge = challengeOpt.get();

        if (challenge.getOtpExpiresAt() == null || challenge.getOtpExpiresAt().isBefore(Instant.now())) {
            challenge.setSuperseded(true);
            passwordResetOtpChallengeRepository.save(challenge);
            throw new BusinessException("INVALID_OTP", "Verification code has expired. Please request a new code.");
        }

        if (challenge.getFailedAttempts() >= challenge.getMaxAttempts()) {
            challenge.setSuperseded(true);
            passwordResetOtpChallengeRepository.save(challenge);
            throw new BusinessException("TOO_MANY_ATTEMPTS", "Maximum verification attempts exceeded. Please request a new code.");
        }

        // Constant-time comparison
        String computedHash = hashOtp(rawOtp, challenge.getOtpSalt());
        boolean isMatch = MessageDigest.isEqual(
                computedHash.getBytes(StandardCharsets.UTF_8),
                challenge.getOtpHash().getBytes(StandardCharsets.UTF_8)
        );

        if (!isMatch) {
            int failed = challenge.getFailedAttempts() + 1;
            challenge.setFailedAttempts(failed);
            if (failed >= challenge.getMaxAttempts()) {
                challenge.setSuperseded(true);
                passwordResetOtpChallengeRepository.save(challenge);
                throw new BusinessException("TOO_MANY_ATTEMPTS", "Too many failed attempts. Please request a new code.");
            }
            passwordResetOtpChallengeRepository.save(challenge);
            int remaining = challenge.getMaxAttempts() - failed;
            throw new BusinessException("INVALID_OTP", "Invalid verification code. " + remaining + " attempt" + (remaining == 1 ? "" : "s") + " remaining.");
        }

        // OTP matched — issue 32-byte (64-char hex) reset token
        String rawResetToken = generateSecureToken();
        String resetTokenHash = hashToken(rawResetToken);

        challenge.setVerified(true);
        challenge.setResetTokenHash(resetTokenHash);
        challenge.setResetTokenExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        passwordResetOtpChallengeRepository.save(challenge);

        log.info("OTP verified successfully for user id={}, issued reset token", user.getId());
        return new VerifyResetOtpResponse(true, "Code verified successfully.", rawResetToken, 600);
    }

    /**
     * Step 3: Resets password using valid reset authorization token. Atomically updates password,
     * invalidates the challenge, and revokes all active refresh sessions.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String token = request.getEffectiveToken();
        if (token == null || token.isBlank()) {
            throw new BusinessException("INVALID_RESET_TOKEN", "Reset token is required.");
        }

        String tokenHash = hashToken(token);
        Optional<PasswordResetOtpChallenge> otpChallengeOpt =
                passwordResetOtpChallengeRepository.findByResetTokenHashAndVerifiedTrueAndConsumedFalseAndSupersededFalse(tokenHash);

        if (otpChallengeOpt.isPresent()) {
            PasswordResetOtpChallenge challenge = otpChallengeOpt.get();
            if (challenge.getResetTokenExpiresAt() == null || challenge.getResetTokenExpiresAt().isBefore(Instant.now())) {
                challenge.setSuperseded(true);
                passwordResetOtpChallengeRepository.save(challenge);
                throw new BusinessException("INVALID_RESET_TOKEN", "Reset session has expired. Please request a new code.");
            }

            User user = challenge.getUser();
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            challenge.setConsumed(true);
            challenge.setSuperseded(true);
            passwordResetOtpChallengeRepository.save(challenge);

            // Invalidate all existing refresh sessions
            refreshTokenRepository.revokeAllByUser(user);
            log.info("Password successfully reset via OTP flow for user id={}", user.getId());
            return;
        }

        // Backward compatibility fallback: check legacy password_reset_tokens table
        PasswordResetToken legacyToken = passwordResetTokenRepository.findByTokenHash(token)
                .orElseThrow(() -> new BusinessException("INVALID_RESET_TOKEN", "Invalid or expired reset token. Please request a new code."));

        if (legacyToken.getExpiresAt().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(legacyToken);
            throw new BusinessException("INVALID_RESET_TOKEN", "Reset link has expired. Please request a new code.");
        }

        User user = legacyToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        passwordResetTokenRepository.delete(legacyToken);
        refreshTokenRepository.revokeAllByUser(user);
        log.info("Password successfully reset via legacy token for user id={}", user.getId());
    }

    // ── Helper Crypto Methods ──────────────────────────────────────────────────

    private String generateOtp() {
        int code = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.format("%06d", code);
    }

    private String generateSalt() {
        byte[] salt = new byte[16];
        SECURE_RANDOM.nextBytes(salt);
        return HexFormat.of().formatHex(salt);
    }

    private String hashOtp(String otp, String salt) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest((otp + salt).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not supported", e);
        }
    }

    private String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not supported", e);
        }
    }

    private String generateSecureToken() {
        byte[] tokenBytes = new byte[32];
        SECURE_RANDOM.nextBytes(tokenBytes);
        return HexFormat.of().formatHex(tokenBytes);
    }

    @Transactional
    public void changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException("INCORRECT_PASSWORD", "Incorrect current password");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        // Invalidate all existing refresh sessions after password change
        refreshTokenRepository.revokeAllByUser(user);
    }

    public User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new BusinessException("NOT_AUTHENTICATED", "Not authenticated");
        }
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> ResourceNotFoundException.user(userDetails.getId()));
    }
    
    @Transactional
    public void resendVerificationEmail(User user) {
        if (user.isEmailVerified()) {
            throw new BusinessException("ALREADY_VERIFIED", "Your email address is already verified");
        }

        emailVerificationTokenRepository.findFirstByUserOrderByCreatedAtDesc(user).ifPresent(lastToken -> {
            if (lastToken.getCreatedAt().isAfter(Instant.now().minusSeconds(60))) {
                throw new BusinessException("RATE_LIMIT_EXCEEDED", "Please wait 60 seconds before requesting another verification email");
            }
        });

        generateAndSendVerificationEmail(user);
    }

    @Transactional
    public void verifyEmailToken(String tokenHash) {
        EmailVerificationToken token = emailVerificationTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BusinessException("INVALID_VERIFICATION_TOKEN", "Invalid or expired verification link"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            emailVerificationTokenRepository.delete(token);
            throw new BusinessException("TOKEN_EXPIRED", "Verification link has expired. Please request a new one");
        }

        User user = token.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        emailVerificationTokenRepository.deleteByUser(user);
    }

    private void generateAndSendVerificationEmail(User user) {
        EmailVerificationToken token = new EmailVerificationToken();
        token.setUser(user);
        token.setTokenHash(UUID.randomUUID().toString());
        token.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        emailVerificationTokenRepository.save(token);
        
        emailService.sendVerificationEmail(user.getEmail(), token.getTokenHash());
    }

    public UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.isEnabled(),
                user.isEmailVerified(),
                user.getCreatedAt()
        );
    }
}
