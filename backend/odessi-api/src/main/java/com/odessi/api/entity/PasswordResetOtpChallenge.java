package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "password_reset_otp_challenges")
public class PasswordResetOtpChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "otp_hash", nullable = false, length = 255)
    private String otpHash;

    @Column(name = "otp_salt", nullable = false, length = 64)
    private String otpSalt;

    @Column(name = "reset_token_hash", length = 255)
    private String resetTokenHash;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts = 0;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts = 5;

    @Column(name = "otp_expires_at", nullable = false)
    private Instant otpExpiresAt;

    @Column(name = "reset_token_expires_at")
    private Instant resetTokenExpiresAt;

    @Column(name = "verified", nullable = false)
    private boolean verified = false;

    @Column(name = "consumed", nullable = false)
    private boolean consumed = false;

    @Column(name = "superseded", nullable = false)
    private boolean superseded = false;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getOtpHash() { return otpHash; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }

    public String getOtpSalt() { return otpSalt; }
    public void setOtpSalt(String otpSalt) { this.otpSalt = otpSalt; }

    public String getResetTokenHash() { return resetTokenHash; }
    public void setResetTokenHash(String resetTokenHash) { this.resetTokenHash = resetTokenHash; }

    public int getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }

    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }

    public Instant getOtpExpiresAt() { return otpExpiresAt; }
    public void setOtpExpiresAt(Instant otpExpiresAt) { this.otpExpiresAt = otpExpiresAt; }

    public Instant getResetTokenExpiresAt() { return resetTokenExpiresAt; }
    public void setResetTokenExpiresAt(Instant resetTokenExpiresAt) { this.resetTokenExpiresAt = resetTokenExpiresAt; }

    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }

    public boolean isConsumed() { return consumed; }
    public void setConsumed(boolean consumed) { this.consumed = consumed; }

    public boolean isSuperseded() { return superseded; }
    public void setSuperseded(boolean superseded) { this.superseded = superseded; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
