package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminReferralResponse;
import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReferralService {
    ReferralResponse getMyReferralCode(User user);
    void recordReferral(User referee, String referralCode);
    void processQualifyingOrder(User referee, Order order);
    Page<AdminReferralResponse> getReferralsForAdmin(Pageable pageable);
}
