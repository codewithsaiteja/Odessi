package com.odessi.api.service;

import com.odessi.api.config.AppProperties;
import com.odessi.api.entity.RefreshToken;
import com.odessi.api.entity.Role;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Refresh Token Tests")
class AuthServiceRefreshTest {

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

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        authService = new AuthService(
                userRepository, refreshTokenRepository, passwordResetTokenRepository,
                passwordResetOtpChallengeRepository,
                emailVerificationTokenRepository, passwordEncoder, jwtService,
                emailService, referralService, appProperties
        );
    }

    @Test
    @DisplayName("rotateRefreshToken — succeeds for valid active token")
    void rotateRefreshToken_success() {
        User user = new User("John", "Doe", "john@example.com", "hash");
        user.setId(1L);
        user.setRole(Role.CUSTOMER);

        RefreshToken token = new RefreshToken();
        token.setId(10L);
        token.setTokenHash("valid-hash");
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusSeconds(3600));
        token.setCreatedAt(Instant.now().minusSeconds(300));
        token.setLastActivityAt(Instant.now().minusSeconds(60));
        token.setRevoked(false);

        given(refreshTokenRepository.findByTokenHashWithUser("valid-hash")).willReturn(Optional.of(token));
        given(userRepository.findById(1L)).willReturn(Optional.of(user));
        given(jwtService.generateToken(any())).willReturn("mock-jwt-token");
        given(refreshTokenRepository.save(any(RefreshToken.class))).willAnswer(inv -> inv.getArgument(0));

        AuthService.TokenRefreshResult result = authService.rotateRefreshToken("valid-hash");

        assertThat(result.accessToken()).isEqualTo("mock-jwt-token");
        assertThat(result.refreshTokenHash()).isNotNull();
        assertThat(token.isRevoked()).isTrue();
    }

    @Test
    @DisplayName("rotateRefreshToken — throws BusinessException and revokes all sessions on token reuse")
    void rotateRefreshToken_reuseAttack() {
        User user = new User("Jane", "Doe", "jane@example.com", "hash");
        user.setId(2L);

        RefreshToken token = new RefreshToken();
        token.setTokenHash("revoked-hash");
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusSeconds(3600));
        token.setRevoked(true); // Already revoked

        given(refreshTokenRepository.findByTokenHashWithUser("revoked-hash")).willReturn(Optional.of(token));
        given(userRepository.findById(2L)).willReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.rotateRefreshToken("revoked-hash"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Security violation");

        verify(refreshTokenRepository).revokeAllByUser(user);
    }

    @Test
    @DisplayName("rotateRefreshToken — throws BusinessException for expired token")
    void rotateRefreshToken_expired() {
        User user = new User("Expired", "User", "expired@example.com", "hash");
        user.setId(3L);

        RefreshToken token = new RefreshToken();
        token.setTokenHash("expired-hash");
        token.setUser(user);
        token.setExpiresAt(Instant.now().minusSeconds(10));
        token.setRevoked(false);

        given(refreshTokenRepository.findByTokenHashWithUser("expired-hash")).willReturn(Optional.of(token));
        given(userRepository.findById(3L)).willReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.rotateRefreshToken("expired-hash"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("rotateRefreshToken — rejects customer session inactive for more than 30 minutes")
    void rotateRefreshToken_customerIdleTimeout_rejected() {
        User user = new User("Customer", "User", "customer@example.com", "hash");
        user.setId(4L);
        user.setRole(Role.CUSTOMER);

        RefreshToken token = new RefreshToken();
        token.setTokenHash("customer-idle-hash");
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusSeconds(86400));
        token.setCreatedAt(Instant.now().minusSeconds(3600));
        token.setLastActivityAt(Instant.now().minusSeconds(1860)); // 31 minutes ago (>30m)
        token.setRevoked(false);

        given(refreshTokenRepository.findByTokenHashWithUser("customer-idle-hash")).willReturn(Optional.of(token));
        given(userRepository.findById(4L)).willReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.rotateRefreshToken("customer-idle-hash"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inactivity");

        assertThat(token.isRevoked()).isTrue();
    }

    @Test
    @DisplayName("rotateRefreshToken — rejects admin session inactive for more than 15 minutes")
    void rotateRefreshToken_adminIdleTimeout_rejected() {
        User user = new User("Admin", "User", "admin@example.com", "hash");
        user.setId(5L);
        user.setRole(Role.ADMIN);

        RefreshToken token = new RefreshToken();
        token.setTokenHash("admin-idle-hash");
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusSeconds(86400));
        token.setCreatedAt(Instant.now().minusSeconds(1800));
        token.setLastActivityAt(Instant.now().minusSeconds(960)); // 16 minutes ago (>15m)
        token.setRevoked(false);

        given(refreshTokenRepository.findByTokenHashWithUser("admin-idle-hash")).willReturn(Optional.of(token));
        given(userRepository.findById(5L)).willReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.rotateRefreshToken("admin-idle-hash"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inactivity");

        assertThat(token.isRevoked()).isTrue();
    }

    @Test
    @DisplayName("extendSession — updates lastActivityAt when session is valid and active")
    void extendSession_success() {
        User user = new User("Active", "User", "active@example.com", "hash");
        user.setId(6L);
        user.setRole(Role.CUSTOMER);

        RefreshToken token = new RefreshToken();
        token.setTokenHash("extend-hash");
        token.setUser(user);
        token.setExpiresAt(Instant.now().plusSeconds(86400));
        token.setCreatedAt(Instant.now().minusSeconds(600));
        token.setLastActivityAt(Instant.now().minusSeconds(300));
        token.setRevoked(false);

        given(refreshTokenRepository.findByTokenHashWithUser("extend-hash")).willReturn(Optional.of(token));
        given(userRepository.findById(6L)).willReturn(Optional.of(user));
        given(refreshTokenRepository.save(any(RefreshToken.class))).willAnswer(inv -> inv.getArgument(0));

        AuthService.SessionStatusResponse response = authService.extendSession("extend-hash");

        assertThat(response.active()).isTrue();
        assertThat(response.role()).isEqualTo("CUSTOMER");
        assertThat(response.remainingSeconds()).isEqualTo(1800);
    }
}
