package com.odessi.api.service;

import com.odessi.api.dto.request.SellerApplyRequest;
import com.odessi.api.dto.request.SellerRewardClaimRequest;
import com.odessi.api.dto.response.SellerDashboardResponse;
import com.odessi.api.dto.response.SellerResponse;
import com.odessi.api.dto.response.SellerRewardResponse;
import com.odessi.api.entity.User;

public interface SellerService {

    SellerResponse applyForSeller(User user, SellerApplyRequest request);

    SellerResponse getSellerStatus(User user);

    SellerDashboardResponse getSellerDashboard(User user);

    SellerRewardResponse claimReward(User user, Long rewardId, SellerRewardClaimRequest request);

    boolean validateSellerCode(String code);
}
