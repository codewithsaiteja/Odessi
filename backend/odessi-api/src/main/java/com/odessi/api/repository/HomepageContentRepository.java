package com.odessi.api.repository;

import com.odessi.api.entity.HomepageContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HomepageContentRepository extends JpaRepository<HomepageContent, Long> {
    Optional<HomepageContent> findBySectionKey(String sectionKey);
    List<HomepageContent> findByActiveTrue();
}
