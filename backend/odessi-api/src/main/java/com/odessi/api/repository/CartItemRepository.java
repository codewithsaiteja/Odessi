package com.odessi.api.repository;

import com.odessi.api.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartIdAndProductVariantId(Long cartId, Long variantId);

    void deleteByCartIdAndId(Long cartId, Long itemId);

    @Modifying
    @Query("DELETE FROM CartItem ci WHERE ci.productVariant.product.id = :productId")
    void deleteAllByProductId(@Param("productId") Long productId);
}
