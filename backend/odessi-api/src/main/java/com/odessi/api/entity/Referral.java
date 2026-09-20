package com.odessi.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "referrals")
public class Referral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referrer_user_id", nullable = false)
    private User referrer;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referee_user_id", nullable = false, unique = true)
    private User referee;

    @Column(name = "code_used", nullable = false, length = 30)
    private String codeUsed;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReferralStatus status = ReferralStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qualifying_order_id")
    private Order qualifyingOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Referral() {}

    public Referral(User referrer, User referee, String codeUsed) {
        this.referrer = referrer;
        this.referee = referee;
        this.codeUsed = codeUsed;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getReferrer() { return referrer; }
    public void setReferrer(User referrer) { this.referrer = referrer; }

    public User getReferee() { return referee; }
    public void setReferee(User referee) { this.referee = referee; }

    public String getCodeUsed() { return codeUsed; }
    public void setCodeUsed(String codeUsed) { this.codeUsed = codeUsed; }

    public ReferralStatus getStatus() { return status; }
    public void setStatus(ReferralStatus status) { this.status = status; }

    public Order getQualifyingOrder() { return qualifyingOrder; }
    public void setQualifyingOrder(Order qualifyingOrder) { this.qualifyingOrder = qualifyingOrder; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
