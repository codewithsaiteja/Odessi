package com.odessi.api.service;

import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.ChangePasswordRequest;
import com.odessi.api.dto.request.ForgotPasswordRequest;
import com.odessi.api.dto.request.LoginRequest;
import com.odessi.api.dto.request.RegisterRequest;
import com.odessi.api.dto.request.ResetPasswordRequest;
import com.odessi.api.dto.response.UserResponse;
import com.odessi.api.entity.EmailVerificationToken;
import com.odessi.api.entity.PasswordResetToken;
import com.odessi.api.entity.RefreshToken;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.EmailVerificationTokenRepository;
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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
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
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            EmailService emailService,
            ReferralService referralService,
            AppProperties appProperties) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
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

        // Record referral if referral code is provided
        if (request.getReferralCode() != null && !request.getReferralCode().isBlank()) {
            try {
                referralService.recordReferral(savedUser, request.getReferralCode());
                log.info("Recorded referral for user id={} with code={}", savedUser.getId(), request.getReferralCode());
            } catch (Exception e) {
                log.warn("Failed to record referral code '{}' for user id={}: {}", request.getReferralCode(), savedUser.getId(), e.getMessage());
            }
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
        refreshToken.setExpiresAt(Instant.now().plusMillis(appProperties.getAuth().getJwtRefreshExpiration()));
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

    /**
     * Verifies a refresh token for rotation.
     *
     * <p>If the token is found but already revoked (replay/reuse attack):
     * <ol>
     *   <li>The entire session family for this user is revoked (all refresh tokens).</li>
     *   <li>A security exception is thrown so the caller returns 401.</li>
     * </ol>
     * This prevents an attacker who stole an old refresh token from maintaining access.
     */
    @Transactional
    public RefreshToken verifyAndRotateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHashWithUser(token)
                .or(() -> refreshTokenRepository.findByTokenHash(token))
                .orElseThrow(() -> new BusinessException("INVALID_REFRESH_TOKEN", "Refresh token is invalid"));

        // Eagerly initialize user properties while hibernate session is open
        if (refreshToken.getUser() != null) {
            refreshToken.getUser().getEmail();
            refreshToken.getUser().getRole();
            refreshToken.getUser().getPasswordHash();
            refreshToken.getUser().isEnabled();
        }

        // ── Reuse/replay attack detection ──────────────────────────────────────
        if (refreshToken.isRevoked()) {
            // A revoked token is being presented again — compromise detected.
            // Invalidate ALL refresh tokens for this user (entire session family).
            refreshTokenRepository.revokeAllByUser(refreshToken.getUser());
            throw new BusinessException("REFRESH_TOKEN_REUSE", "Security violation: refresh token reuse detected. All sessions have been invalidated.");
        }

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException("REFRESH_TOKEN_EXPIRED", "Refresh token has expired. Please log in again.");
        }

        // ── Rotation: revoke old token, caller will issue new one ──────────────
        refreshToken.setRevoked(true);
        refreshToken.setLastUsedAt(Instant.now());
        refreshTokenRepository.save(refreshToken);

        return refreshToken;
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail().toLowerCase().trim()).ifPresent(user -> {
            PasswordResetToken token = new PasswordResetToken();
            token.setUser(user);
            token.setTokenHash(UUID.randomUUID().toString());
            token.setExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS));
            passwordResetTokenRepository.save(token);

            emailService.sendPasswordResetEmail(user.getEmail(), token.getTokenHash());
        });
        // Always return generic response in controller
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenHash(request.getToken())
                .orElseThrow(() -> new BusinessException("INVALID_RESET_TOKEN", "Invalid or expired reset token"));

        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new BusinessException("INVALID_RESET_TOKEN", "Invalid or expired reset token");
        }

        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Consume token & invalidate all existing refresh sessions
        passwordResetTokenRepository.delete(resetToken);
        refreshTokenRepository.revokeAllByUser(user);
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
