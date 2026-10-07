package com.odessi.api.repository;

import com.odessi.api.entity.StoreCreditAccount;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoreCreditAccountRepository extends JpaRepository<StoreCreditAccount, Long> {

    Optional<StoreCreditAccount> findByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM StoreCreditAccount a WHERE a.user.id = :userId")
    Optional<StoreCreditAccount> findByUserIdWithLock(@Param("userId") Long userId);
}
