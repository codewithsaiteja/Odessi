package com.odessi.api.service;

import com.odessi.api.dto.request.SellerMilestoneConfigRequest;
import com.odessi.api.dto.response.SellerMilestoneConfigResponse;
import com.odessi.api.entity.Seller;
import com.odessi.api.entity.User;

import java.util.List;

public interface SellerMilestoneService {

    List<SellerMilestoneConfigResponse> getActiveMilestones();

    List<SellerMilestoneConfigResponse> getAllMilestones();

    SellerMilestoneConfigResponse getMilestoneById(Long id);

    SellerMilestoneConfigResponse createMilestone(User admin, SellerMilestoneConfigRequest request);

    SellerMilestoneConfigResponse updateMilestone(User admin, Long id, SellerMilestoneConfigRequest request);

    void evaluateMilestonesForSeller(Seller seller);
}
