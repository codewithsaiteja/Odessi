package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "homepage_content")
public class HomepageContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "section_key", nullable = false, unique = true, length = 50)
    private String sectionKey;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "eyebrow", length = 200)
    private String eyebrow;

    @Column(name = "headline", columnDefinition = "TEXT")
    private String headline;

    @Column(name = "sub_headline", columnDefinition = "TEXT")
    private String subHeadline;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Column(name = "primary_cta_label", length = 100)
    private String primaryCtaLabel;

    @Column(name = "primary_cta_url", length = 255)
    private String primaryCtaUrl;

    @Column(name = "secondary_cta_label", length = 100)
    private String secondaryCtaLabel;

    @Column(name = "secondary_cta_url", length = 255)
    private String secondaryCtaUrl;

    @Column(name = "media_url", length = 500)
    private String mediaUrl;

    @Column(name = "mobile_media_url", length = 500)
    private String mobileMediaUrl;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "custom_payload", columnDefinition = "TEXT")
    private String customPayload;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public HomepageContent() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSectionKey() { return sectionKey; }
    public void setSectionKey(String sectionKey) { this.sectionKey = sectionKey; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getEyebrow() { return eyebrow; }
    public void setEyebrow(String eyebrow) { this.eyebrow = eyebrow; }

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getSubHeadline() { return subHeadline; }
    public void setSubHeadline(String subHeadline) { this.subHeadline = subHeadline; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getPrimaryCtaLabel() { return primaryCtaLabel; }
    public void setPrimaryCtaLabel(String primaryCtaLabel) { this.primaryCtaLabel = primaryCtaLabel; }

    public String getPrimaryCtaUrl() { return primaryCtaUrl; }
    public void setPrimaryCtaUrl(String primaryCtaUrl) { this.primaryCtaUrl = primaryCtaUrl; }

    public String getSecondaryCtaLabel() { return secondaryCtaLabel; }
    public void setSecondaryCtaLabel(String secondaryCtaLabel) { this.secondaryCtaLabel = secondaryCtaLabel; }

    public String getSecondaryCtaUrl() { return secondaryCtaUrl; }
    public void setSecondaryCtaUrl(String secondaryCtaUrl) { this.secondaryCtaUrl = secondaryCtaUrl; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

    public String getMobileMediaUrl() { return mobileMediaUrl; }
    public void setMobileMediaUrl(String mobileMediaUrl) { this.mobileMediaUrl = mobileMediaUrl; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getCustomPayload() { return customPayload; }
    public void setCustomPayload(String customPayload) { this.customPayload = customPayload; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
