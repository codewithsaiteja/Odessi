package com.odessi.api.repository;

import com.odessi.api.entity.Collection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollectionRepository extends JpaRepository<Collection, Long> {

    Optional<Collection> findBySlug(String slug);

    List<Collection> findAllByActiveTrue();

    List<Collection> findAllByActiveTrueAndFeaturedTrue();

    boolean existsBySlug(String slug);
}
