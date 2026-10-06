package com.odessi.api.repository;

import com.odessi.api.entity.ReferralSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for the single-row {@link ReferralSettings} configuration.
 *
 * <p>Always use {@link #getSingleton()} to retrieve the active settings.
 * If the seed row is missing (should never happen post-V30 migration), a
 * default instance will be returned instead of throwing.</p>
 */
@Repository
public interface ReferralSettingsRepository extends JpaRepository<ReferralSettings, Integer> {

    /** Returns the singleton settings row (id=1) or empty if not seeded. */
    default Optional<ReferralSettings> getSingleton() {
        return findById(1);
    }
}
