package com.odessi.api.repository;

import com.odessi.api.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartIdAndProductVariantId(Long cartId, Long variantId);

    void deleteByCartIdAndId(Long cartId, Long itemId);
}
