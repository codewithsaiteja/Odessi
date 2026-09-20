package com.odessi.api.service;

import com.odessi.api.dto.request.AddWishlistItemRequest;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.mapper.WishlistMapper;
import com.odessi.api.repository.*;
import com.odessi.api.service.impl.WishlistServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WishlistService unit tests")
class WishlistServiceTest {

    @Mock WishlistRepository wishlistRepository;
    @Mock WishlistItemRepository wishlistItemRepository;
    @Mock ProductRepository productRepository;
    @Mock UserRepository userRepository;
    @Mock WishlistMapper wishlistMapper;

    WishlistServiceImpl wishlistService;

    @BeforeEach
    void setUp() {
        wishlistService = new WishlistServiceImpl(
            wishlistRepository, wishlistItemRepository,
            productRepository, userRepository, wishlistMapper
        );
    }

    @Test
    @DisplayName("addItem — throws DUPLICATE_WISHLIST_ITEM when product already in wishlist")
    void addItem_duplicatePrevented() {
        User user = new User("Test", "User", "test@odessi.tfi", "hash");
        Wishlist wishlist = new Wishlist(user);

        given(wishlistRepository.findByUserIdWithItems(1L)).willReturn(Optional.of(wishlist));
        given(wishlistItemRepository.existsByWishlistIdAndProductId(any(), eq(5L))).willReturn(true);

        AddWishlistItemRequest request = new AddWishlistItemRequest(5L);

        assertThatThrownBy(() -> wishlistService.addItem(1L, request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("already in your wishlist");
    }

    @Test
    @DisplayName("addItem — succeeds when product not already in wishlist")
    void addItem_success() {
        User user = new User("Test", "User", "test@odessi.tfi", "hash");
        Wishlist wishlist = new Wishlist(user);
        Product product = new Product();
        product.setName("Shadow Striker Tee");
        product.setSlug("shadow-striker-tee");
        product.setPrice(new BigDecimal("899.00"));
        product.setCurrency("INR");

        given(wishlistRepository.findByUserIdWithItems(1L)).willReturn(Optional.of(wishlist));
        given(wishlistItemRepository.existsByWishlistIdAndProductId(any(), eq(1L))).willReturn(false);
        given(productRepository.findById(1L)).willReturn(Optional.of(product));
        given(wishlistRepository.save(any())).willReturn(wishlist);
        given(wishlistRepository.findByUserIdWithItems(1L)).willReturn(Optional.of(wishlist));
        given(wishlistMapper.toResponse(wishlist)).willReturn(null);

        // Should not throw
        assertThatNoException().isThrownBy(() ->
            wishlistService.addItem(1L, new AddWishlistItemRequest(1L))
        );
    }
}
