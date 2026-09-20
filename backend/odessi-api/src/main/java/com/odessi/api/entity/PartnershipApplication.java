package com.odessi.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "partnership_applications")
public class PartnershipApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_name", nullable = false, length = 150)
    private String businessName;

    @Column(name = "contact_person", nullable = false, length = 100)
    private String contactPerson;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String state;

    @Column(name = "business_type", nullable = false, length = 50)
    private String businessType;

    @Column(name = "estimated_monthly_requirement", length = 100)
    private String estimatedMonthlyRequirement;

    @Column(name = "website_instagram", length = 255)
    private String websiteInstagram;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PartnershipStatus status = PartnershipStatus.NEW;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public PartnershipApplication() {}

    public PartnershipApplication(String businessName, String contactPerson, String phone, String email,
                                  String city, String state, String businessType,
                                  String estimatedMonthlyRequirement, String websiteInstagram, String message) {
        this.businessName = businessName;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.city = city;
        this.state = state;
        this.businessType = businessType;
        this.estimatedMonthlyRequirement = estimatedMonthlyRequirement;
        this.websiteInstagram = websiteInstagram;
        this.message = message;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }

    public String getEstimatedMonthlyRequirement() { return estimatedMonthlyRequirement; }
    public void setEstimatedMonthlyRequirement(String estimatedMonthlyRequirement) { this.estimatedMonthlyRequirement = estimatedMonthlyRequirement; }

    public String getWebsiteInstagram() { return websiteInstagram; }
    public void setWebsiteInstagram(String websiteInstagram) { this.websiteInstagram = websiteInstagram; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public PartnershipStatus getStatus() { return status; }
    public void setStatus(PartnershipStatus status) { this.status = status; }

    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
