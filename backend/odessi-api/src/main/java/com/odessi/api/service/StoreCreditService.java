package com.odessi.api.service;

import com.odessi.api.entity.*;

import java.math.BigDecimal;
import java.util.List;

public interface StoreCreditService {

    /**
     * Retrieves or lazily creates a store credit account for the user.
     */
    StoreCreditAccount getOrCreateAccount(User user);

    /**
     * Returns the spendable store credit balance for the user.
     */
    BigDecimal getAvailableBalance(User user);

    /**
     * Credits the user's account with the specified amount, updating balances and appending
     * an immutable entry to the transaction ledger.
     * Enforces idempotency via idempotencyKey.
     */
    StoreCreditTransaction credit(
        User user,
        BigDecimal amount,
        StoreCreditTransactionType type,
        StoreCreditReferenceType referenceType,
        Long referenceId,
        String idempotencyKey,
        String description
    );

    /**
     * Returns all ledger transactions for the user, newest first.
     */
    List<StoreCreditTransaction> getTransactionHistory(User user);
}
