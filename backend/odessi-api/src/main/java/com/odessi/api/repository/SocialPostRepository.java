package com.odessi.api.repository;

import com.odessi.api.entity.SocialPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SocialPostRepository extends JpaRepository<SocialPost, Long> {

    @Query("SELECT s FROM SocialPost s LEFT JOIN FETCH s.product LEFT JOIN FETCH s.collection WHERE s.published = true ORDER BY s.displayOrder ASC, s.createdAt DESC")
    List<SocialPost> findPublishedPostsWithRelations();

    @Query(value = "SELECT s FROM SocialPost s LEFT JOIN FETCH s.product LEFT JOIN FETCH s.collection ORDER BY s.displayOrder ASC, s.createdAt DESC",
           countQuery = "SELECT COUNT(s) FROM SocialPost s")
    Page<SocialPost> findAllForAdmin(Pageable pageable);

    @Query("SELECT s FROM SocialPost s LEFT JOIN FETCH s.product LEFT JOIN FETCH s.collection WHERE s.product.id = :productId AND s.published = true ORDER BY s.displayOrder ASC, s.createdAt DESC")
    List<SocialPost> findByProductIdAndPublishedTrue(Long productId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE SocialPost sp SET sp.mediaUrl = :newUrl WHERE sp.mediaUrl = :oldUrl")
    int updateMediaUrl(@org.springframework.data.repository.query.Param("oldUrl") String oldUrl, @org.springframework.data.repository.query.Param("newUrl") String newUrl);
}
