package com.odessi.api.mapper;

import com.odessi.api.dto.response.ProductImageResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import java.time.Instant;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-20T00:05:49+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.100.v20260826-1225, environment: Java 21.0.12.1 (Eclipse Adoptium)"
)
@Component
public class ProductImageMapperImpl implements ProductImageMapper {

    @Override
    public ProductImageResponse toResponse(ProductImage image) {
        if ( image == null ) {
            return null;
        }

        Long productId = null;
        Long id = null;
        String imageUrl = null;
        String altText = null;
        int sortOrder = 0;
        String mediaType = null;
        String videoUrl = null;
        String posterUrl = null;
        Instant createdAt = null;

        productId = imageProductId( image );
        id = image.getId();
        imageUrl = image.getImageUrl();
        altText = image.getAltText();
        sortOrder = image.getSortOrder();
        mediaType = image.getMediaType();
        videoUrl = image.getVideoUrl();
        posterUrl = image.getPosterUrl();
        createdAt = image.getCreatedAt();

        boolean isPrimary = false;

        ProductImageResponse productImageResponse = new ProductImageResponse( id, productId, imageUrl, altText, sortOrder, isPrimary, mediaType, videoUrl, posterUrl, createdAt );

        return productImageResponse;
    }

    private Long imageProductId(ProductImage productImage) {
        if ( productImage == null ) {
            return null;
        }
        Product product = productImage.getProduct();
        if ( product == null ) {
            return null;
        }
        Long id = product.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }
}
