package com.odessi.api.service.impl;

import com.odessi.api.dto.request.AddWishlistItemRequest;
import com.odessi.api.dto.response.WishlistResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.WishlistMapper;
import com.odessi.api.repository.*;
import com.odessi.api.service.WishlistService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final WishlistMapper wishlistMapper;

    public WishlistServiceImpl(
            WishlistRepository wishlistRepository,
            WishlistItemRepository wishlistItemRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            WishlistMapper wishlistMapper) {
        this.wishlistRepository = wishlistRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.wishlistMapper = wishlistMapper;
    }

    @Override
    public WishlistResponse getWishlist(Long userId) {
        Wishlist wishlist = getOrCreateWishlist(userId);
        return wishlistMapper.toResponse(wishlist);
    }

    @Override
    public WishlistResponse addItem(Long userId, AddWishlistItemRequest request) {
        Wishlist wishlist = getOrCreateWishlist(userId);

        // Prevent duplicates — enforced here and by DB unique constraint
        if (wishlistItemRepository.existsByWishlistIdAndProductId(wishlist.getId(), request.productId())) {
            throw BusinessException.duplicateWishlistItem();
        }

        Product product = productRepository.findById(request.productId())
            .orElseThrow(() -> ResourceNotFoundException.productById(request.productId()));

        WishlistItem item = new WishlistItem(wishlist, product);
        wishlist.getItems().add(item);
        wishlistRepository.save(wishlist);

        Wishlist refreshed = wishlistRepository.findByUserIdWithItems(userId)
            .orElseThrow(() -> ResourceNotFoundException.wishlist(userId));
        return wishlistMapper.toResponse(refreshed);
    }

    @Override
    public WishlistResponse removeItem(Long userId, Long productId) {
        Wishlist wishlist = wishlistRepository.findByUserId(userId)
            .orElseThrow(() -> ResourceNotFoundException.wishlist(userId));

        wishlistItemRepository.deleteByWishlistIdAndProductId(wishlist.getId(), productId);

        Wishlist refreshed = wishlistRepository.findByUserIdWithItems(userId)
            .orElseThrow(() -> ResourceNotFoundException.wishlist(userId));
        return wishlistMapper.toResponse(refreshed);
    }

    // ── Private helpers ───────────────────────────────────────────

    private Wishlist getOrCreateWishlist(Long userId) {
        return wishlistRepository.findByUserIdWithItems(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.user(userId));
            Wishlist newWishlist = new Wishlist(user);
            return wishlistRepository.save(newWishlist);
        });
    }
}
