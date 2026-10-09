package com.odessi.api.service;

import com.odessi.api.dto.request.SellerRewardStatusUpdateRequest;
import com.odessi.api.dto.response.*;
import com.odessi.api.entity.SellerRewardStatus;
import com.odessi.api.entity.SellerStatus;
import com.odessi.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AdminSellerService {

    Page<SellerResponse> getSellers(SellerStatus status, String search, Pageable pageable);

    SellerResponse getSellerById(Long id);

    SellerResponse updateSellerStatus(User admin, Long id, SellerStatus newStatus, String reason);

    Page<SellerRewardResponse> getRewardClaims(SellerRewardStatus status, Pageable pageable);

    SellerRewardResponse updateRewardStatus(User admin, Long rewardId, SellerRewardStatusUpdateRequest request);

    Page<SellerAttributionResponse> getAttributions(Long sellerId, String status, Pageable pageable);

    SellerAttributionResponse overrideAttribution(User admin, Long attributionId, boolean qualifying, String reason);

    List<SellerAuditLogResponse> getSellerAuditLogs(Long sellerId);

    Page<SellerAuditLogResponse> getAllAuditLogs(Pageable pageable);

    SellerPerformanceStatsResponse getPerformanceStats();
}
