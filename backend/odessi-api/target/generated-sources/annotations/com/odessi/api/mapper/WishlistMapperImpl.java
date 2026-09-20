package com.odessi.api.mapper;

import com.odessi.api.dto.response.ProductSummaryResponse;
import com.odessi.api.dto.response.WishlistItemResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.WishlistItem;
import java.time.Instant;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-20T00:05:49+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.100.v20260826-1225, environment: Java 21.0.12.1 (Eclipse Adoptium)"
)
@Component
public class WishlistMapperImpl implements WishlistMapper {

    @Autowired
    private ProductMapper productMapper;

    @Override
    public WishlistItemResponse toItemResponse(WishlistItem item) {
        if ( item == null ) {
            return null;
        }

        Long productId = null;
        String productName = null;
        String productSlug = null;
        ProductSummaryResponse product = null;
        Instant addedAt = null;
        Long id = null;

        productId = itemProductId( item );
        productName = itemProductName( item );
        productSlug = itemProductSlug( item );
        product = productMapper.toSummaryResponse( item.getProduct() );
        addedAt = item.getCreatedAt();
        id = item.getId();

        WishlistItemResponse wishlistItemResponse = new WishlistItemResponse( id, productId, productName, productSlug, product, addedAt );

        return wishlistItemResponse;
    }

    private Long itemProductId(WishlistItem wishlistItem) {
        if ( wishlistItem == null ) {
            return null;
        }
        Product product = wishlistItem.getProduct();
        if ( product == null ) {
            return null;
        }
        Long id = product.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String itemProductName(WishlistItem wishlistItem) {
        if ( wishlistItem == null ) {
            return null;
        }
        Product product = wishlistItem.getProduct();
        if ( product == null ) {
            return null;
        }
        String name = product.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    private String itemProductSlug(WishlistItem wishlistItem) {
        if ( wishlistItem == null ) {
            return null;
        }
        Product product = wishlistItem.getProduct();
        if ( product == null ) {
            return null;
        }
        String slug = product.getSlug();
        if ( slug == null ) {
            return null;
        }
        return slug;
    }
}
