package com.odessi.api.service;

import com.odessi.api.dto.request.AddCartItemRequest;
import com.odessi.api.dto.request.MergeCartRequest;
import com.odessi.api.dto.request.UpdateCartItemRequest;
import com.odessi.api.dto.response.CartResponse;

public interface CartService {

    CartResponse getCart(Long userId);

    CartResponse addItem(Long userId, AddCartItemRequest request);

    CartResponse updateItem(Long userId, Long itemId, UpdateCartItemRequest request);

    CartResponse removeItem(Long userId, Long itemId);

    void clearCart(Long userId);

    CartResponse mergeCart(Long userId, MergeCartRequest request);
}
