package com.odessi.api.mapper;

import com.odessi.api.dto.response.ProductImageResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import java.time.Instant;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-22T00:05:31+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
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
        boolean isPrimary = false;
        String mediaType = null;
        String videoUrl = null;
        String posterUrl = null;
        Instant createdAt = null;

        productId = imageProductId( image );
        id = image.getId();
        imageUrl = image.getImageUrl();
        altText = image.getAltText();
        sortOrder = image.getSortOrder();
        isPrimary = image.getIsPrimary();
        mediaType = image.getMediaType();
        videoUrl = image.getVideoUrl();
        posterUrl = image.getPosterUrl();
        createdAt = image.getCreatedAt();

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
