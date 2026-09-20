package com.odessi.api.mapper;

import com.odessi.api.dto.response.WishlistItemResponse;
import com.odessi.api.dto.response.WishlistResponse;
import com.odessi.api.entity.Wishlist;
import com.odessi.api.entity.WishlistItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = {ProductMapper.class})
public interface WishlistMapper {

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productName", source = "product.name")
    @Mapping(target = "productSlug", source = "product.slug")
    @Mapping(target = "product", source = "product")
    @Mapping(target = "addedAt", source = "createdAt")
    WishlistItemResponse toItemResponse(WishlistItem item);

    default WishlistResponse toResponse(Wishlist wishlist) {
        List<WishlistItemResponse> items = wishlist.getItems().stream()
            .map(this::toItemResponse)
            .toList();

        return new WishlistResponse(
            wishlist.getId(),
            wishlist.getUser().getId(),
            items,
            items.size(),
            wishlist.getUpdatedAt()
        );
    }
}
