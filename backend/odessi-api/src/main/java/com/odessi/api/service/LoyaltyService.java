package com.odessi.api.service;

import com.odessi.api.dto.response.LoyaltyAccountResponse;
import com.odessi.api.entity.User;

public interface LoyaltyService {
    LoyaltyAccountResponse getStatus(User user);
}
