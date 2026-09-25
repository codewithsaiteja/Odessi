package com.odessi.api.repository;

import com.odessi.api.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * JpaSpecificationExecutor enables dynamic filtering via Specification API —
 * used by ProductSpecification to build complex filter queries without loading
 * the full product table into memory.
 */
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySlugAndActiveTrue(String slug);

    Optional<Product> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Page<Product> findAllByActiveTrue(Pageable pageable);

    Page<Product> findAllByActiveTrueAndFeaturedTrue(Pageable pageable);

    Page<Product> findAllByActiveTrueAndBestsellerTrue(Pageable pageable);

    Page<Product> findAllByActiveTrueAndNewArrivalTrue(Pageable pageable);

    /**
     * Fetch a product with all its variants, category, and collection in one query to avoid N+1.
     */
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.variants v LEFT JOIN FETCH p.category c LEFT JOIN FETCH p.collection col WHERE p.slug = :slug AND p.active = true")
    Optional<Product> findBySlugWithVariants(@Param("slug") String slug);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.variants v WHERE p.id = :id")
    Optional<Product> findByIdWithVariants(@Param("id") Long id);
}
