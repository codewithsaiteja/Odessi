package com.odessi.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sellers")
public class Seller {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "seller_code", nullable = false, unique = true, length = 50)
    private String sellerCode;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 50)
    private String phone;

    @Column(name = "social_channel", nullable = false, length = 255)
    private String socialChannel;

    @Column(name = "application_reason", nullable = false, columnDefinition = "TEXT")
    private String applicationReason;

    @Column(name = "terms_accepted", nullable = false)
    private boolean termsAccepted = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SellerStatus status = SellerStatus.PENDING;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "suspension_reason", columnDefinition = "TEXT")
    private String suspensionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_admin_id")
    private User approvedByAdmin;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by_admin_id")
    private User rejectedByAdmin;

    @Column(name = "rejected_at")
    private Instant rejectedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suspended_by_admin_id")
    private User suspendedByAdmin;

    @Column(name = "suspended_at")
    private Instant suspendedAt;

    @Column(name = "verified_sales_count", nullable = false)
    private int verifiedSalesCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Seller() {}

    public Seller(User user, String sellerCode, String fullName, String email, String phone,
                  String socialChannel, String applicationReason) {
        this.user = user;
        this.sellerCode = sellerCode;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.socialChannel = socialChannel;
        this.applicationReason = applicationReason;
        this.termsAccepted = true;
        this.status = SellerStatus.PENDING;
        this.verifiedSalesCount = 0;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getSellerCode() { return sellerCode; }
    public void setSellerCode(String sellerCode) { this.sellerCode = sellerCode; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSocialChannel() { return socialChannel; }
    public void setSocialChannel(String socialChannel) { this.socialChannel = socialChannel; }

    public String getApplicationReason() { return applicationReason; }
    public void setApplicationReason(String applicationReason) { this.applicationReason = applicationReason; }

    public boolean isTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(boolean termsAccepted) { this.termsAccepted = termsAccepted; }

    public SellerStatus getStatus() { return status; }
    public void setStatus(SellerStatus status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getSuspensionReason() { return suspensionReason; }
    public void setSuspensionReason(String suspensionReason) { this.suspensionReason = suspensionReason; }

    public User getApprovedByAdmin() { return approvedByAdmin; }
    public void setApprovedByAdmin(User approvedByAdmin) { this.approvedByAdmin = approvedByAdmin; }

    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }

    public User getRejectedByAdmin() { return rejectedByAdmin; }
    public void setRejectedByAdmin(User rejectedByAdmin) { this.rejectedByAdmin = rejectedByAdmin; }

    public Instant getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(Instant rejectedAt) { this.rejectedAt = rejectedAt; }

    public User getSuspendedByAdmin() { return suspendedByAdmin; }
    public void setSuspendedByAdmin(User suspendedByAdmin) { this.suspendedByAdmin = suspendedByAdmin; }

    public Instant getSuspendedAt() { return suspendedAt; }
    public void setSuspendedAt(Instant suspendedAt) { this.suspendedAt = suspendedAt; }

    public int getVerifiedSalesCount() { return verifiedSalesCount; }
    public void setVerifiedSalesCount(int verifiedSalesCount) { this.verifiedSalesCount = verifiedSalesCount; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
