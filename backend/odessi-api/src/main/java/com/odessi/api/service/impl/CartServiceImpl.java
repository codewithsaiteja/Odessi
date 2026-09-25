package com.odessi.api.service.impl;

import com.odessi.api.dto.request.AddCartItemRequest;
import com.odessi.api.dto.request.MergeCartRequest;
import com.odessi.api.dto.request.UpdateCartItemRequest;
import com.odessi.api.dto.response.CartResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.CartMapper;
import com.odessi.api.repository.*;
import com.odessi.api.service.CartService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CartServiceImpl implements CartService {

    private static final Logger log = LoggerFactory.getLogger(CartServiceImpl.class);

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository variantRepository;
    private final UserRepository userRepository;
    private final CartMapper cartMapper;

    public CartServiceImpl(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            ProductVariantRepository variantRepository,
            UserRepository userRepository,
            CartMapper cartMapper) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.variantRepository = variantRepository;
        this.userRepository = userRepository;
        this.cartMapper = cartMapper;
    }

    @Override
    public CartResponse getCart(Long userId) {
        Cart cart = getOrCreateCart(userId);
        return cartMapper.toResponse(cart);
    }

    @Override
    public CartResponse addItem(Long userId, AddCartItemRequest request) {
        Cart cart = getOrCreateCart(userId);

        ProductVariant variant = variantRepository.findById(request.variantId())
            .orElseThrow(() -> ResourceNotFoundException.variant(request.variantId()));

        if (!variant.isAvailable()) {
            throw BusinessException.variantUnavailable(variant.getSku());
        }

        if (variant.getProduct().isDrop() && variant.getProduct().getLaunchAt() != null && variant.getProduct().getLaunchAt().isAfter(java.time.Instant.now())) {
            throw new com.odessi.api.exception.BadRequestException("PRODUCT_NOT_RELEASED", "This drop product is not yet available for purchase.");
        }

        if (request.quantity() > variant.getStockQuantity()) {
            throw BusinessException.insufficientStock(variant.getSku(), request.quantity(), variant.getStockQuantity());
        }

        // If item already exists in cart, increment quantity
        var existingItem = cartItemRepository.findByCartIdAndProductVariantId(cart.getId(), variant.getId());
        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQty = item.getQuantity() + request.quantity();
            if (newQty > variant.getStockQuantity()) {
                throw BusinessException.insufficientStock(variant.getSku(), newQty, variant.getStockQuantity());
            }
            item.setQuantity(newQty);
            cartItemRepository.save(item);
        } else {
            CartItem item = new CartItem(cart, variant, request.quantity());
            cart.addItem(item);
            cartRepository.save(cart);
        }

        log.debug("Added/updated cart item: userId={}, variantId={}, qty={}", userId, variant.getId(), request.quantity());

        Cart refreshed = cartRepository.findByUserIdWithItems(userId)
            .orElseThrow(() -> ResourceNotFoundException.cart(userId));
        return cartMapper.toResponse(refreshed);
    }

    @Override
    public CartResponse updateItem(Long userId, Long itemId, UpdateCartItemRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
            .orElseThrow(() -> ResourceNotFoundException.cart(userId));

        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> ResourceNotFoundException.cartItem(itemId));

        // Security: ensure item belongs to this user's cart
        if (!item.getCart().getId().equals(cart.getId())) {
            throw ResourceNotFoundException.cartItem(itemId);
        }

        ProductVariant variant = item.getProductVariant();
        if (request.quantity() > variant.getStockQuantity()) {
            throw BusinessException.insufficientStock(variant.getSku(), request.quantity(), variant.getStockQuantity());
        }

        item.setQuantity(request.quantity());
        cartItemRepository.save(item);

        Cart refreshed = cartRepository.findByUserIdWithItems(userId)
            .orElseThrow(() -> ResourceNotFoundException.cart(userId));
        return cartMapper.toResponse(refreshed);
    }

    @Override
    public CartResponse removeItem(Long userId, Long itemId) {
        Cart cart = cartRepository.findByUserId(userId)
            .orElseThrow(() -> ResourceNotFoundException.cart(userId));

        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> ResourceNotFoundException.cartItem(itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw ResourceNotFoundException.cartItem(itemId);
        }

        cart.removeItem(item);
        cartRepository.save(cart);

        Cart refreshed = cartRepository.findByUserIdWithItems(userId)
            .orElseThrow(() -> ResourceNotFoundException.cart(userId));
        return cartMapper.toResponse(refreshed);
    }

    @Override
    public void clearCart(Long userId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cart.getItems().clear();
            cartRepository.save(cart);
        });
    }

    @Override
    public CartResponse mergeCart(Long userId, MergeCartRequest request) {
        Cart cart = getOrCreateCart(userId);

        for (AddCartItemRequest guestItem : request.getItems()) {
            try {
                ProductVariant variant = variantRepository.findById(guestItem.variantId()).orElse(null);
                if (variant == null || !variant.isAvailable() || guestItem.quantity() <= 0) {
                    continue; // Skip invalid variants silently during merge
                }

                var existingItemOpt = cartItemRepository.findByCartIdAndProductVariantId(cart.getId(), variant.getId());
                if (existingItemOpt.isPresent()) {
                    CartItem item = existingItemOpt.get();
                    int newQty = item.getQuantity() + guestItem.quantity();
                    item.setQuantity(Math.min(newQty, variant.getStockQuantity()));
                    cartItemRepository.save(item);
                } else {
                    int qty = Math.min(guestItem.quantity(), variant.getStockQuantity());
                    CartItem item = new CartItem(cart, variant, qty);
                    cart.addItem(item);
                    cartRepository.save(cart);
                }
            } catch (Exception e) {
                log.warn("Failed to merge guest cart item: {}", guestItem.variantId(), e);
            }
        }

        Cart refreshed = cartRepository.findByUserIdWithItems(userId)
            .orElseThrow(() -> ResourceNotFoundException.cart(userId));
        return cartMapper.toResponse(refreshed);
    }

    // ── Private helpers ───────────────────────────────────────────

    private Cart getOrCreateCart(Long userId) {
        // Acquire pessimistic write lock on User first to serialize cart creation & item mutations per user
        User user = userRepository.findByIdForUpdate(userId)
            .orElseThrow(() -> ResourceNotFoundException.user(userId));

        return cartRepository.findByUserIdWithItems(userId).orElseGet(() -> {
            Cart newCart = new Cart(user);
            return cartRepository.save(newCart);
        });
    }
}
