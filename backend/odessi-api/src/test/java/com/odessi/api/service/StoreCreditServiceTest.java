package com.odessi.api.service;

import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.StoreCreditAccountRepository;
import com.odessi.api.repository.StoreCreditTransactionRepository;
import com.odessi.api.service.impl.StoreCreditServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StoreCreditServiceTest {

    @Mock
    private StoreCreditAccountRepository accountRepository;

    @Mock
    private StoreCreditTransactionRepository transactionRepository;

    @InjectMocks
    private StoreCreditServiceImpl storeCreditService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(101L);
        user.setEmail("userA@odessi.tfi");
        user.setFirstName("User");
        user.setLastName("A");
    }

    @Test
    @DisplayName("getAvailableBalance returns zero when no account exists")
    void getAvailableBalanceReturnsZeroWhenNoAccount() {
        when(accountRepository.findByUserId(101L)).thenReturn(Optional.empty());

        BigDecimal balance = storeCreditService.getAvailableBalance(user);

        assertThat(balance).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("getAvailableBalance returns current spendable balance")
    void getAvailableBalanceReturnsCurrentBalance() {
        StoreCreditAccount account = new StoreCreditAccount(user);
        account.setAvailableBalance(new BigDecimal("100.00"));
        when(accountRepository.findByUserId(101L)).thenReturn(Optional.of(account));

        BigDecimal balance = storeCreditService.getAvailableBalance(user);

        assertThat(balance).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("credit adds amount to balance and updates lifetime credited")
    void creditAddsAmountAndUpdatesLifetimeCredited() {
        StoreCreditAccount account = new StoreCreditAccount(user);
        account.setAvailableBalance(new BigDecimal("25.00"));
        account.setLifetimeCredited(new BigDecimal("25.00"));

        when(transactionRepository.findByIdempotencyKey("REF_REWARD_1")).thenReturn(Optional.empty());
        when(accountRepository.findByUserIdWithLock(101L)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(StoreCreditAccount.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.save(any(StoreCreditTransaction.class))).thenAnswer(i -> i.getArgument(0));

        StoreCreditTransaction tx = storeCreditService.credit(
            user,
            new BigDecimal("75.00"),
            StoreCreditTransactionType.REFERRAL_REWARD,
            StoreCreditReferenceType.REFERRAL,
            1L,
            "REF_REWARD_1",
            "Referral reward"
        );

        assertThat(tx).isNotNull();
        assertThat(tx.getAmount()).isEqualByComparingTo("75.00");
        assertThat(tx.getBalanceAfter()).isEqualByComparingTo("100.00");
        assertThat(account.getAvailableBalance()).isEqualByComparingTo("100.00");
        assertThat(account.getLifetimeCredited()).isEqualByComparingTo("100.00");
        verify(transactionRepository).save(any(StoreCreditTransaction.class));
    }

    @Test
    @DisplayName("credit enforces idempotency by key and does not double credit")
    void creditIdempotencyKeyPreventsDoubleCredit() {
        StoreCreditTransaction existingTx = new StoreCreditTransaction();
        existingTx.setId(55L);
        existingTx.setAmount(new BigDecimal("100.00"));
        existingTx.setIdempotencyKey("REF_REWARD_99");

        when(transactionRepository.findByIdempotencyKey("REF_REWARD_99")).thenReturn(Optional.of(existingTx));

        StoreCreditTransaction tx = storeCreditService.credit(
            user,
            new BigDecimal("100.00"),
            StoreCreditTransactionType.REFERRAL_REWARD,
            StoreCreditReferenceType.REFERRAL,
            99L,
            "REF_REWARD_99",
            "Duplicate attempt"
        );

        assertThat(tx.getId()).isEqualTo(55L);
        // Verify no new transaction or account save was executed
        verify(accountRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("credit creates account if not already present")
    void creditCreatesAccountIfNotPresent() {
        when(transactionRepository.findByIdempotencyKey("REF_REWARD_2")).thenReturn(Optional.empty());
        when(accountRepository.findByUserIdWithLock(101L)).thenReturn(Optional.empty());
        when(accountRepository.saveAndFlush(any(StoreCreditAccount.class))).thenAnswer(i -> i.getArgument(0));
        when(accountRepository.save(any(StoreCreditAccount.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.save(any(StoreCreditTransaction.class))).thenAnswer(i -> i.getArgument(0));

        StoreCreditTransaction tx = storeCreditService.credit(
            user,
            new BigDecimal("50.00"),
            StoreCreditTransactionType.REFERRAL_REWARD,
            StoreCreditReferenceType.REFERRAL,
            2L,
            "REF_REWARD_2",
            "Referral reward"
        );

        assertThat(tx).isNotNull();
        assertThat(tx.getAmount()).isEqualByComparingTo("50.00");
        assertThat(tx.getBalanceAfter()).isEqualByComparingTo("50.00");
    }

    @Test
    @DisplayName("credit rejects zero or negative amounts")
    void creditRejectsInvalidAmount() {
        assertThatThrownBy(() -> storeCreditService.credit(
            user,
            BigDecimal.ZERO,
            StoreCreditTransactionType.REFERRAL_REWARD,
            StoreCreditReferenceType.REFERRAL,
            1L,
            "KEY",
            "Zero"
        )).isInstanceOf(BadRequestException.class);

        assertThatThrownBy(() -> storeCreditService.credit(
            user,
            new BigDecimal("-10.00"),
            StoreCreditTransactionType.REFERRAL_REWARD,
            StoreCreditReferenceType.REFERRAL,
            1L,
            "KEY",
            "Negative"
        )).isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("getTransactionHistory returns ledger items in chronological order")
    void getTransactionHistoryReturnsList() {
        StoreCreditTransaction tx1 = new StoreCreditTransaction();
        tx1.setId(1L);
        when(transactionRepository.findByUserIdOrderByCreatedAtDesc(101L)).thenReturn(List.of(tx1));

        List<StoreCreditTransaction> list = storeCreditService.getTransactionHistory(user);

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getId()).isEqualTo(1L);
    }
}
