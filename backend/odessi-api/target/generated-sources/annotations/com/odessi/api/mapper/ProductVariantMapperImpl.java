package com.odessi.api.mapper;

import com.odessi.api.dto.response.ProductVariantResponse;
import com.odessi.api.entity.ProductVariant;
import java.math.BigDecimal;
import java.time.Instant;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-22T00:05:31+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class ProductVariantMapperImpl implements ProductVariantMapper {

    @Override
    public ProductVariantResponse toResponse(ProductVariant variant) {
        if ( variant == null ) {
            return null;
        }

        Long id = null;
        String sku = null;
        String size = null;
        String color = null;
        String colorHex = null;
        BigDecimal price = null;
        int stockQuantity = 0;
        boolean active = false;
        Instant createdAt = null;

        id = variant.getId();
        sku = variant.getSku();
        size = variant.getSize();
        color = variant.getColor();
        colorHex = variant.getColorHex();
        price = variant.getPrice();
        stockQuantity = variant.getStockQuantity();
        active = variant.isActive();
        createdAt = variant.getCreatedAt();

        boolean available = variant.isAvailable();

        ProductVariantResponse productVariantResponse = new ProductVariantResponse( id, sku, size, color, colorHex, price, stockQuantity, available, active, createdAt );

        return productVariantResponse;
    }
}
