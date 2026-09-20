package com.odessi.api.service.impl;

import com.odessi.api.dto.response.LoyaltyAccountResponse;
import com.odessi.api.entity.LoyaltyAccount;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.LoyaltyAccountRepository;
import com.odessi.api.service.LoyaltyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoyaltyServiceImpl implements LoyaltyService {

    private final LoyaltyAccountRepository repository;

    public LoyaltyServiceImpl(LoyaltyAccountRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public LoyaltyAccountResponse getStatus(User user) {
        if (user == null || user.getId() == null) {
            throw new BadRequestException("USER_REQUIRED", "Authenticated user required");
        }

        LoyaltyAccount account = repository.findByUserId(user.getId())
            .orElseGet(() -> repository.save(new LoyaltyAccount(user)));

        return new LoyaltyAccountResponse(
            user.getId(),
            user.getEmail(),
            account.getTier(),
            account.getStatus(),
            account.getCreatedAt()
        );
    }
}
