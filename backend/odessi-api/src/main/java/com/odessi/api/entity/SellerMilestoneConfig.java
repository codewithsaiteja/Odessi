package com.odessi.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "seller_milestone_configs")
public class SellerMilestoneConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tier_level", nullable = false, unique = true)
    private int tierLevel;

    @Column(name = "milestone_name", nullable = false, length = 100)
    private String milestoneName;

    @Column(name = "qualifying_sales_threshold", nullable = false, unique = true)
    private int qualifyingSalesThreshold;

    @Column(name = "reward_title", nullable = false, length = 150)
    private String rewardTitle;

    @Column(name = "reward_description", nullable = false, columnDefinition = "TEXT")
    private String rewardDescription;

    @Column(name = "reward_type", nullable = false, length = 50)
    private String rewardType = "PHYSICAL_GIFT";

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int version = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public SellerMilestoneConfig() {}

    public SellerMilestoneConfig(int tierLevel, String milestoneName, int qualifyingSalesThreshold,
                                 String rewardTitle, String rewardDescription, String rewardType,
                                 String imageUrl, boolean active) {
        this.tierLevel = tierLevel;
        this.milestoneName = milestoneName;
        this.qualifyingSalesThreshold = qualifyingSalesThreshold;
        this.rewardTitle = rewardTitle;
        this.rewardDescription = rewardDescription;
        this.rewardType = rewardType != null ? rewardType : "PHYSICAL_GIFT";
        this.imageUrl = imageUrl;
        this.active = active;
        this.version = 1;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public int getTierLevel() { return tierLevel; }
    public void setTierLevel(int tierLevel) { this.tierLevel = tierLevel; }

    public String getMilestoneName() { return milestoneName; }
    public void setMilestoneName(String milestoneName) { this.milestoneName = milestoneName; }

    public int getQualifyingSalesThreshold() { return qualifyingSalesThreshold; }
    public void setQualifyingSalesThreshold(int qualifyingSalesThreshold) { this.qualifyingSalesThreshold = qualifyingSalesThreshold; }

    public String getRewardTitle() { return rewardTitle; }
    public void setRewardTitle(String rewardTitle) { this.rewardTitle = rewardTitle; }

    public String getRewardDescription() { return rewardDescription; }
    public void setRewardDescription(String rewardDescription) { this.rewardDescription = rewardDescription; }

    public String getRewardType() { return rewardType; }
    public void setRewardType(String rewardType) { this.rewardType = rewardType; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
