package com.odessi.api.service;

import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.ResetPasswordRequest;
import com.odessi.api.dto.request.VerifyResetOtpRequest;
import com.odessi.api.dto.response.VerifyResetOtpResponse;
import com.odessi.api.entity.PasswordResetOtpChallenge;
import com.odessi.api.entity.PasswordResetToken;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.repository.EmailVerificationTokenRepository;
import com.odessi.api.repository.PasswordResetOtpChallengeRepository;
import com.odessi.api.repository.PasswordResetTokenRepository;
import com.odessi.api.repository.RefreshTokenRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService OTP Password Recovery Tests")
class AuthServiceOtpRecoveryTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock PasswordResetOtpChallengeRepository passwordResetOtpChallengeRepository;
    @Mock EmailVerificationTokenRepository emailVerificationTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock EmailService emailService;
    @Mock ReferralService referralService;

    AppProperties appProperties;
    AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        authService = new AuthService(
                userRepository, refreshTokenRepository, passwordResetTokenRepository,
                passwordResetOtpChallengeRepository,
                emailVerificationTokenRepository, passwordEncoder, jwtService,
                emailService, referralService, appProperties
        );

        testUser = new User("Sai", "Teja", "sai@odessitfi.me", "$2a$10$existingHash");
        testUser.setId(10L);
    }

    @Test
    @DisplayName("requestPasswordResetOtp — generates OTP and sends email for registered user")
    void requestPasswordResetOtp_success() {
        when(userRepository.findByEmail("sai@odessitfi.me")).thenReturn(Optional.of(testUser));
        when(passwordResetOtpChallengeRepository.findFirstByUserOrderByCreatedAtDesc(testUser))
                .thenReturn(Optional.empty());

        authService.requestPasswordResetOtp("sai@odessitfi.me", "127.0.0.1");

        verify(passwordResetOtpChallengeRepository).supersedeActiveChallengesForUser(testUser);

        ArgumentCaptor<PasswordResetOtpChallenge> challengeCaptor =
                ArgumentCaptor.forClass(PasswordResetOtpChallenge.class);
        verify(passwordResetOtpChallengeRepository).save(challengeCaptor.capture());

        PasswordResetOtpChallenge savedChallenge = challengeCaptor.getValue();
        assertThat(savedChallenge.getEmail()).isEqualTo("sai@odessitfi.me");
        assertThat(savedChallenge.getOtpHash()).isNotBlank();
        assertThat(savedChallenge.getOtpSalt()).hasSize(32);
        assertThat(savedChallenge.getFailedAttempts()).isZero();
        assertThat(savedChallenge.getMaxAttempts()).isEqualTo(5);
        assertThat(savedChallenge.getOtpExpiresAt()).isAfter(Instant.now().plus(4, ChronoUnit.MINUTES));

        verify(emailService).sendPasswordResetOtpEmail(eq("sai@odessitfi.me"), anyString(), eq(5));
    }

    @Test
    @DisplayName("requestPasswordResetOtp — silent defense for unregistered email")
    void requestPasswordResetOtp_unregisteredEmail_noError() {
        when(userRepository.findByEmail("unknown@odessitfi.me")).thenReturn(Optional.empty());

        authService.requestPasswordResetOtp("unknown@odessitfi.me", "127.0.0.1");

        verify(passwordResetOtpChallengeRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetOtpEmail(anyString(), anyString(), anyInt());
    }

    @Test
    @DisplayName("requestPasswordResetOtp — rejects request within 60s cooldown")
    void requestPasswordResetOtp_cooldownViolation() {
        when(userRepository.findByEmail("sai@odessitfi.me")).thenReturn(Optional.of(testUser));

        PasswordResetOtpChallenge recentChallenge = new PasswordResetOtpChallenge();
        recentChallenge.setUser(testUser);
        // Created 30 seconds ago
        try {
            var createdAtField = PasswordResetOtpChallenge.class.getDeclaredField("createdAt");
            createdAtField.setAccessible(true);
            createdAtField.set(recentChallenge, Instant.now().minusSeconds(30));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(passwordResetOtpChallengeRepository.findFirstByUserOrderByCreatedAtDesc(testUser))
                .thenReturn(Optional.of(recentChallenge));

        assertThatThrownBy(() -> authService.requestPasswordResetOtp("sai@odessitfi.me", "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Please wait 60 seconds");

        verify(passwordResetOtpChallengeRepository, never()).supersedeActiveChallengesForUser(any());
        verify(emailService, never()).sendPasswordResetOtpEmail(anyString(), anyString(), anyInt());
    }

    @Test
    @DisplayName("verifyPasswordResetOtp — validates matching OTP and issues reset token")
    void verifyPasswordResetOtp_success() throws Exception {
        when(userRepository.findByEmail("sai@odessitfi.me")).thenReturn(Optional.of(testUser));

        String rawOtp = "482915";
        String salt = HexFormat.of().formatHex(new byte[16]);
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        String otpHash = HexFormat.of().formatHex(md.digest((rawOtp + salt).getBytes(StandardCharsets.UTF_8)));

        PasswordResetOtpChallenge challenge = new PasswordResetOtpChallenge();
        challenge.setUser(testUser);
        challenge.setEmail("sai@odessitfi.me");
        challenge.setOtpSalt(salt);
        challenge.setOtpHash(otpHash);
        challenge.setFailedAttempts(0);
        challenge.setMaxAttempts(5);
        challenge.setOtpExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));

        when(passwordResetOtpChallengeRepository.findFirstByUserAndSupersededFalseAndConsumedFalseOrderByCreatedAtDesc(testUser))
                .thenReturn(Optional.of(challenge));

        VerifyResetOtpResponse response = authService.verifyPasswordResetOtp(
                new VerifyResetOtpRequest("sai@odessitfi.me", rawOtp),
                "127.0.0.1"
        );

        assertThat(response.success()).isTrue();
        assertThat(response.resetToken()).isNotBlank().hasSize(64);
        assertThat(response.expiresInSeconds()).isEqualTo(600);
        assertThat(challenge.isVerified()).isTrue();
        assertThat(challenge.getResetTokenHash()).isNotBlank();
        assertThat(challenge.getResetTokenExpiresAt()).isAfter(Instant.now().plus(9, ChronoUnit.MINUTES));
    }

    @Test
    @DisplayName("verifyPasswordResetOtp — increments failed attempts on invalid code")
    void verifyPasswordResetOtp_invalidOtp_incrementsFailedAttempts() throws Exception {
        when(userRepository.findByEmail("sai@odessitfi.me")).thenReturn(Optional.of(testUser));

        String salt = HexFormat.of().formatHex(new byte[16]);
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        String otpHash = HexFormat.of().formatHex(md.digest(("111111" + salt).getBytes(StandardCharsets.UTF_8)));

        PasswordResetOtpChallenge challenge = new PasswordResetOtpChallenge();
        challenge.setUser(testUser);
        challenge.setEmail("sai@odessitfi.me");
        challenge.setOtpSalt(salt);
        challenge.setOtpHash(otpHash);
        challenge.setFailedAttempts(0);
        challenge.setMaxAttempts(5);
        challenge.setOtpExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));

        when(passwordResetOtpChallengeRepository.findFirstByUserAndSupersededFalseAndConsumedFalseOrderByCreatedAtDesc(testUser))
                .thenReturn(Optional.of(challenge));

        assertThatThrownBy(() -> authService.verifyPasswordResetOtp(
                new VerifyResetOtpRequest("sai@odessitfi.me", "999999"),
                "127.0.0.1"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("4 attempts remaining");

        assertThat(challenge.getFailedAttempts()).isEqualTo(1);
        assertThat(challenge.isSuperseded()).isFalse();
        verify(passwordResetOtpChallengeRepository).save(challenge);
    }

    @Test
    @DisplayName("verifyPasswordResetOtp — supersedes challenge after 5 failed attempts")
    void verifyPasswordResetOtp_maxAttemptsReached_supersedesChallenge() throws Exception {
        when(userRepository.findByEmail("sai@odessitfi.me")).thenReturn(Optional.of(testUser));

        String salt = HexFormat.of().formatHex(new byte[16]);
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        String otpHash = HexFormat.of().formatHex(md.digest(("111111" + salt).getBytes(StandardCharsets.UTF_8)));

        PasswordResetOtpChallenge challenge = new PasswordResetOtpChallenge();
        challenge.setUser(testUser);
        challenge.setEmail("sai@odessitfi.me");
        challenge.setOtpSalt(salt);
        challenge.setOtpHash(otpHash);
        challenge.setFailedAttempts(4); // already failed 4 times
        challenge.setMaxAttempts(5);
        challenge.setOtpExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));

        when(passwordResetOtpChallengeRepository.findFirstByUserAndSupersededFalseAndConsumedFalseOrderByCreatedAtDesc(testUser))
                .thenReturn(Optional.of(challenge));

        assertThatThrownBy(() -> authService.verifyPasswordResetOtp(
                new VerifyResetOtpRequest("sai@odessitfi.me", "999999"),
                "127.0.0.1"
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Too many failed attempts");

        assertThat(challenge.getFailedAttempts()).isEqualTo(5);
        assertThat(challenge.isSuperseded()).isTrue();
        verify(passwordResetOtpChallengeRepository).save(challenge);
    }

    @Test
    @DisplayName("resetPassword — resets password with valid reset token and revokes user sessions")
    void resetPassword_withValidResetToken_success() throws Exception {
        String rawToken = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        String tokenHash = HexFormat.of().formatHex(md.digest(rawToken.getBytes(StandardCharsets.UTF_8)));

        PasswordResetOtpChallenge challenge = new PasswordResetOtpChallenge();
        challenge.setUser(testUser);
        challenge.setResetTokenHash(tokenHash);
        challenge.setResetTokenExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        challenge.setVerified(true);
        challenge.setConsumed(false);
        challenge.setSuperseded(false);

        when(passwordResetOtpChallengeRepository.findByResetTokenHashAndVerifiedTrueAndConsumedFalseAndSupersededFalse(tokenHash))
                .thenReturn(Optional.of(challenge));
        when(passwordEncoder.encode("NewStrongPassword@2026")).thenReturn("$2a$10$newHashedPassword");

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setResetToken(rawToken);
        request.setNewPassword("NewStrongPassword@2026");

        authService.resetPassword(request);

        assertThat(testUser.getPasswordHash()).isEqualTo("$2a$10$newHashedPassword");
        assertThat(challenge.isConsumed()).isTrue();
        assertThat(challenge.isSuperseded()).isTrue();
        verify(userRepository).save(testUser);
        verify(passwordResetOtpChallengeRepository).save(challenge);
        verify(refreshTokenRepository).revokeAllByUser(testUser);
    }

    @Test
    @DisplayName("resetPassword — falls back to legacy token if not in OTP challenges")
    void resetPassword_fallbackToLegacyToken_success() {
        String legacyTokenStr = "legacy-uuid-token";
        when(passwordResetOtpChallengeRepository.findByResetTokenHashAndVerifiedTrueAndConsumedFalseAndSupersededFalse(anyString()))
                .thenReturn(Optional.empty());

        PasswordResetToken legacyToken = new PasswordResetToken();
        legacyToken.setUser(testUser);
        legacyToken.setTokenHash(legacyTokenStr);
        legacyToken.setExpiresAt(Instant.now().plus(30, ChronoUnit.MINUTES));

        when(passwordResetTokenRepository.findByTokenHash(legacyTokenStr)).thenReturn(Optional.of(legacyToken));
        when(passwordEncoder.encode("NewStrongPassword@2026")).thenReturn("$2a$10$newHashedPassword");

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken(legacyTokenStr);
        request.setNewPassword("NewStrongPassword@2026");

        authService.resetPassword(request);

        assertThat(testUser.getPasswordHash()).isEqualTo("$2a$10$newHashedPassword");
        verify(passwordResetTokenRepository).delete(legacyToken);
        verify(refreshTokenRepository).revokeAllByUser(testUser);
    }
}
