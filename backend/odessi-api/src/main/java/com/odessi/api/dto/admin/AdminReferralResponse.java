package com.odessi.api.dto.admin;

import com.odessi.api.entity.Referral;
import java.math.BigDecimal;
import java.time.Instant;

public class AdminReferralResponse {
    private Long id;
    private Long referrerId;
    private String referrerName;
    private String referrerEmail;
    private Long refereeId;
    private String refereeName;
    private String refereeEmail;
    private String codeUsed;
    private String status;
    private Long qualifyingOrderId;
    private String qualifyingOrderNumber;
    private BigDecimal qualifyingOrderTotal;
    private Instant createdAt;

    public AdminReferralResponse() {}

    public static AdminReferralResponse fromEntity(Referral referral) {
        AdminReferralResponse dto = new AdminReferralResponse();
        dto.setId(referral.getId());
        if (referral.getReferrer() != null) {
            dto.setReferrerId(referral.getReferrer().getId());
            dto.setReferrerName(referral.getReferrer().getFirstName() + " " + referral.getReferrer().getLastName());
            dto.setReferrerEmail(referral.getReferrer().getEmail());
        }
        if (referral.getReferee() != null) {
            dto.setRefereeId(referral.getReferee().getId());
            dto.setRefereeName(referral.getReferee().getFirstName() + " " + referral.getReferee().getLastName());
            dto.setRefereeEmail(referral.getReferee().getEmail());
        }
        dto.setCodeUsed(referral.getCodeUsed());
        dto.setStatus(referral.getStatus() != null ? referral.getStatus().name() : "PENDING");
        if (referral.getQualifyingOrder() != null) {
            dto.setQualifyingOrderId(referral.getQualifyingOrder().getId());
            dto.setQualifyingOrderNumber(referral.getQualifyingOrder().getOrderNumber());
            dto.setQualifyingOrderTotal(referral.getQualifyingOrder().getTotalAmount());
        }
        dto.setCreatedAt(referral.getCreatedAt());
        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getReferrerId() { return referrerId; }
    public void setReferrerId(Long referrerId) { this.referrerId = referrerId; }

    public String getReferrerName() { return referrerName; }
    public void setReferrerName(String referrerName) { this.referrerName = referrerName; }

    public String getReferrerEmail() { return referrerEmail; }
    public void setReferrerEmail(String referrerEmail) { this.referrerEmail = referrerEmail; }

    public Long getRefereeId() { return refereeId; }
    public void setRefereeId(Long refereeId) { this.refereeId = refereeId; }

    public String getRefereeName() { return refereeName; }
    public void setRefereeName(String refereeName) { this.refereeName = refereeName; }

    public String getRefereeEmail() { return refereeEmail; }
    public void setRefereeEmail(String refereeEmail) { this.refereeEmail = refereeEmail; }

    public String getCodeUsed() { return codeUsed; }
    public void setCodeUsed(String codeUsed) { this.codeUsed = codeUsed; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getQualifyingOrderId() { return qualifyingOrderId; }
    public void setQualifyingOrderId(Long qualifyingOrderId) { this.qualifyingOrderId = qualifyingOrderId; }

    public String getQualifyingOrderNumber() { return qualifyingOrderNumber; }
    public void setQualifyingOrderNumber(String qualifyingOrderNumber) { this.qualifyingOrderNumber = qualifyingOrderNumber; }

    public BigDecimal getQualifyingOrderTotal() { return qualifyingOrderTotal; }
    public void setQualifyingOrderTotal(BigDecimal qualifyingOrderTotal) { this.qualifyingOrderTotal = qualifyingOrderTotal; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
