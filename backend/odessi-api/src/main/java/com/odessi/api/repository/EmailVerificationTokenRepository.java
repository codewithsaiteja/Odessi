package com.odessi.api.repository;

import com.odessi.api.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);
    Optional<EmailVerificationToken> findFirstByUserOrderByCreatedAtDesc(com.odessi.api.entity.User user);
    void deleteByUser(com.odessi.api.entity.User user);
}
