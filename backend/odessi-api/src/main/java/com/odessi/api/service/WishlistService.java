package com.odessi.api.service;

import com.odessi.api.dto.request.AddWishlistItemRequest;
import com.odessi.api.dto.response.WishlistResponse;

public interface WishlistService {

    WishlistResponse getWishlist(Long userId);

    WishlistResponse addItem(Long userId, AddWishlistItemRequest request);

    WishlistResponse removeItem(Long userId, Long productId);
}
