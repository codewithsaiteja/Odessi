package com.odessi.api.service.impl;

import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.StoreCreditAccountRepository;
import com.odessi.api.repository.StoreCreditTransactionRepository;
import com.odessi.api.service.StoreCreditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class StoreCreditServiceImpl implements StoreCreditService {

    private static final Logger log = LoggerFactory.getLogger(StoreCreditServiceImpl.class);

    private final StoreCreditAccountRepository accountRepository;
    private final StoreCreditTransactionRepository transactionRepository;

    public StoreCreditServiceImpl(
            StoreCreditAccountRepository accountRepository,
            StoreCreditTransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    @Override
    @Transactional
    public StoreCreditAccount getOrCreateAccount(User user) {
        if (user == null || user.getId() == null) {
            throw new BadRequestException("USER_REQUIRED", "Valid user required for store credit");
        }
        return accountRepository.findByUserId(user.getId())
                .orElseGet(() -> accountRepository.save(new StoreCreditAccount(user)));
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getAvailableBalance(User user) {
        if (user == null || user.getId() == null) {
            return BigDecimal.ZERO;
        }
        return accountRepository.findByUserId(user.getId())
                .map(StoreCreditAccount::getAvailableBalance)
                .orElse(BigDecimal.ZERO);
    }

    @Override
    @Transactional
    public StoreCreditTransaction credit(
            User user,
            BigDecimal amount,
            StoreCreditTransactionType type,
            StoreCreditReferenceType referenceType,
            Long referenceId,
            String idempotencyKey,
            String description) {

        if (user == null || user.getId() == null) {
            throw new BadRequestException("USER_REQUIRED", "Valid user required for store credit");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("INVALID_AMOUNT", "Credit amount must be greater than zero");
        }

        // Layer 1 idempotency check: has this transaction key already been executed?
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<StoreCreditTransaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                log.info("Store credit idempotency hit for key '{}'. Returning existing transaction id={}.",
                        idempotencyKey, existing.get().getId());
                return existing.get();
            }
        }

        // Acquire lock on user's store credit account to serialize balance mutations
        StoreCreditAccount account = accountRepository.findByUserIdWithLock(user.getId())
                .orElseGet(() -> {
                    try {
                        StoreCreditAccount newAcc = new StoreCreditAccount(user);
                        return accountRepository.saveAndFlush(newAcc);
                    } catch (Exception e) {
                        return accountRepository.findByUserIdWithLock(user.getId())
                                .orElseThrow(() -> new IllegalStateException("Unable to retrieve or initialize store credit account for user id: " + user.getId()));
                    }
                });

        BigDecimal balanceBefore = account.getAvailableBalance() != null ? account.getAvailableBalance() : BigDecimal.ZERO;
        BigDecimal newBalance = balanceBefore.add(amount);
        BigDecimal lifetimeBefore = account.getLifetimeCredited() != null ? account.getLifetimeCredited() : BigDecimal.ZERO;
        BigDecimal newLifetimeCredited = lifetimeBefore.add(amount);

        account.setAvailableBalance(newBalance);
        account.setLifetimeCredited(newLifetimeCredited);
        StoreCreditAccount savedAccount = accountRepository.save(account);

        StoreCreditTransaction tx = new StoreCreditTransaction(
                savedAccount,
                user,
                amount,
                newBalance,
                type,
                referenceType,
                referenceId,
                idempotencyKey,
                description
        );

        StoreCreditTransaction savedTx = transactionRepository.save(tx);

        log.info("Credited {} store credit to user id={}. Balance: {} -> {}. Tx id={}, key='{}'",
                amount, user.getId(), balanceBefore, newBalance, savedTx.getId(), idempotencyKey);

        return savedTx;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoreCreditTransaction> getTransactionHistory(User user) {
        if (user == null || user.getId() == null) {
            return List.of();
        }
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }
}
