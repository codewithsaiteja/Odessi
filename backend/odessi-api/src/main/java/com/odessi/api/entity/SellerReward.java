package com.odessi.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "seller_rewards",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_seller_milestone_reward", columnNames = {"seller_id", "milestone_config_id"})
    }
)
public class SellerReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "milestone_config_id", nullable = false)
    private SellerMilestoneConfig milestoneConfig;

    @Column(name = "tier_level", nullable = false)
    private int tierLevel;

    @Column(name = "milestone_name_snapshot", nullable = false, length = 100)
    private String milestoneNameSnapshot;

    @Column(name = "reward_title_snapshot", nullable = false, length = 150)
    private String rewardTitleSnapshot;

    @Column(name = "reward_description_snapshot", nullable = false, columnDefinition = "TEXT")
    private String rewardDescriptionSnapshot;

    @Column(name = "qualifying_sales_at_unlock", nullable = false)
    private int qualifyingSalesAtUnlock;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SellerRewardStatus status = SellerRewardStatus.UNLOCKED;

    @Column(name = "unlocked_at", nullable = false, updatable = false)
    private Instant unlockedAt = Instant.now();

    @Column(name = "claimed_at")
    private Instant claimedAt;

    @Column(name = "shipping_full_name", length = 150)
    private String shippingFullName;

    @Column(name = "shipping_phone", length = 50)
    private String shippingPhone;

    @Column(name = "shipping_address_line1", length = 255)
    private String shippingAddressLine1;

    @Column(name = "shipping_address_line2", length = 255)
    private String shippingAddressLine2;

    @Column(name = "shipping_city", length = 100)
    private String shippingCity;

    @Column(name = "shipping_state", length = 100)
    private String shippingState;

    @Column(name = "shipping_postal_code", length = 20)
    private String shippingPostalCode;

    @Column(name = "tshirt_size", length = 10)
    private String tshirtSize;

    @Column(name = "shipping_carrier", length = 100)
    private String shippingCarrier;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "tracking_url", length = 255)
    private String trackingUrl;

    @Column(name = "dispatched_at")
    private Instant dispatchedAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_admin_id")
    private User updatedByAdmin;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public SellerReward() {}

    public SellerReward(Seller seller, SellerMilestoneConfig config, int qualifyingSalesAtUnlock) {
        this.seller = seller;
        this.milestoneConfig = config;
        this.tierLevel = config.getTierLevel();
        this.milestoneNameSnapshot = config.getMilestoneName();
        this.rewardTitleSnapshot = config.getRewardTitle();
        this.rewardDescriptionSnapshot = config.getRewardDescription();
        this.qualifyingSalesAtUnlock = qualifyingSalesAtUnlock;
        this.status = SellerRewardStatus.UNLOCKED;
        this.unlockedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Seller getSeller() { return seller; }
    public void setSeller(Seller seller) { this.seller = seller; }

    public SellerMilestoneConfig getMilestoneConfig() { return milestoneConfig; }
    public void setMilestoneConfig(SellerMilestoneConfig milestoneConfig) { this.milestoneConfig = milestoneConfig; }

    public int getTierLevel() { return tierLevel; }
    public void setTierLevel(int tierLevel) { this.tierLevel = tierLevel; }

    public String getMilestoneNameSnapshot() { return milestoneNameSnapshot; }
    public void setMilestoneNameSnapshot(String milestoneNameSnapshot) { this.milestoneNameSnapshot = milestoneNameSnapshot; }

    public String getRewardTitleSnapshot() { return rewardTitleSnapshot; }
    public void setRewardTitleSnapshot(String rewardTitleSnapshot) { this.rewardTitleSnapshot = rewardTitleSnapshot; }

    public String getRewardDescriptionSnapshot() { return rewardDescriptionSnapshot; }
    public void setRewardDescriptionSnapshot(String rewardDescriptionSnapshot) { this.rewardDescriptionSnapshot = rewardDescriptionSnapshot; }

    public int getQualifyingSalesAtUnlock() { return qualifyingSalesAtUnlock; }
    public void setQualifyingSalesAtUnlock(int qualifyingSalesAtUnlock) { this.qualifyingSalesAtUnlock = qualifyingSalesAtUnlock; }

    public SellerRewardStatus getStatus() { return status; }
    public void setStatus(SellerRewardStatus status) { this.status = status; }

    public Instant getUnlockedAt() { return unlockedAt; }
    public void setUnlockedAt(Instant unlockedAt) { this.unlockedAt = unlockedAt; }

    public Instant getClaimedAt() { return claimedAt; }
    public void setClaimedAt(Instant claimedAt) { this.claimedAt = claimedAt; }

    public String getShippingFullName() { return shippingFullName; }
    public void setShippingFullName(String shippingFullName) { this.shippingFullName = shippingFullName; }

    public String getShippingPhone() { return shippingPhone; }
    public void setShippingPhone(String shippingPhone) { this.shippingPhone = shippingPhone; }

    public String getShippingAddressLine1() { return shippingAddressLine1; }
    public void setShippingAddressLine1(String shippingAddressLine1) { this.shippingAddressLine1 = shippingAddressLine1; }

    public String getShippingAddressLine2() { return shippingAddressLine2; }
    public void setShippingAddressLine2(String shippingAddressLine2) { this.shippingAddressLine2 = shippingAddressLine2; }

    public String getShippingCity() { return shippingCity; }
    public void setShippingCity(String shippingCity) { this.shippingCity = shippingCity; }

    public String getShippingState() { return shippingState; }
    public void setShippingState(String shippingState) { this.shippingState = shippingState; }

    public String getShippingPostalCode() { return shippingPostalCode; }
    public void setShippingPostalCode(String shippingPostalCode) { this.shippingPostalCode = shippingPostalCode; }

    public String getTshirtSize() { return tshirtSize; }
    public void setTshirtSize(String tshirtSize) { this.tshirtSize = tshirtSize; }

    public String getShippingCarrier() { return shippingCarrier; }
    public void setShippingCarrier(String shippingCarrier) { this.shippingCarrier = shippingCarrier; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public String getTrackingUrl() { return trackingUrl; }
    public void setTrackingUrl(String trackingUrl) { this.trackingUrl = trackingUrl; }

    public Instant getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(Instant dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public Instant getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(Instant deliveredAt) { this.deliveredAt = deliveredAt; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public User getUpdatedByAdmin() { return updatedByAdmin; }
    public void setUpdatedByAdmin(User updatedByAdmin) { this.updatedByAdmin = updatedByAdmin; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
