package com.odessi.api.repository;

import com.odessi.api.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    Optional<WishlistItem> findByWishlistIdAndProductId(Long wishlistId, Long productId);

    boolean existsByWishlistIdAndProductId(Long wishlistId, Long productId);

    void deleteByWishlistIdAndProductId(Long wishlistId, Long productId);

    @Modifying
    @Query("DELETE FROM WishlistItem wi WHERE wi.product.id = :productId")
    void deleteAllByProductId(@Param("productId") Long productId);
}
