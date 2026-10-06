package com.odessi.api.repository;

import com.odessi.api.entity.PasswordResetOtpChallenge;
import com.odessi.api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetOtpChallengeRepository extends JpaRepository<PasswordResetOtpChallenge, Long> {

    Optional<PasswordResetOtpChallenge> findFirstByUserAndSupersededFalseAndConsumedFalseOrderByCreatedAtDesc(User user);

    Optional<PasswordResetOtpChallenge> findFirstByUserOrderByCreatedAtDesc(User user);

    Optional<PasswordResetOtpChallenge> findByResetTokenHashAndVerifiedTrueAndConsumedFalseAndSupersededFalse(String resetTokenHash);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE PasswordResetOtpChallenge c SET c.superseded = true, c.updatedAt = :now WHERE c.user = :user AND c.consumed = false AND c.superseded = false")
    void supersedeActiveChallengesForUser(@Param("user") User user, @Param("now") java.time.Instant now);

    default void supersedeActiveChallengesForUser(User user) {
        supersedeActiveChallengesForUser(user, java.time.Instant.now());
    }
}

