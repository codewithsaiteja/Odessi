package com.odessi.api.mapper;

import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.dto.response.ProductSummaryResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = {CategoryMapper.class, CollectionMapper.class, ProductVariantMapper.class, ProductImageMapper.class})
public interface ProductMapper {

    @Mapping(target = "category", source = "category")
    @Mapping(target = "collection", source = "collection")
    @Mapping(target = "variants", source = "variants")
    @Mapping(target = "images", source = "images")
    @Mapping(target = "imageUrls", expression = "java(extractImageUrls(product))")
    @Mapping(target = "averageRating", ignore = true)
    @Mapping(target = "reviewCount", ignore = true)
    ProductResponse toResponse(Product product);

    @Mapping(target = "categorySlug", expression = "java(product.getCategory() != null ? product.getCategory().getSlug() : null)")
    @Mapping(target = "categoryName", expression = "java(product.getCategory() != null ? product.getCategory().getName() : null)")
    @Mapping(target = "collectionSlug", expression = "java(product.getCollection() != null ? product.getCollection().getSlug() : null)")
    @Mapping(target = "hasAvailableVariants", expression = "java(product.getVariants().stream().anyMatch(v -> v.isAvailable()))")
    @Mapping(target = "images", expression = "java(extractImageUrls(product))")
    @Mapping(target = "primaryImageUrl", expression = "java(extractPrimaryImageUrl(product))")
    @Mapping(target = "averageRating", ignore = true)
    @Mapping(target = "reviewCount", ignore = true)
    ProductSummaryResponse toSummaryResponse(Product product);

    default List<String> extractImageUrls(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return List.of();
        }
        return product.getImages().stream()
                .map(ProductImage::getImageUrl)
                .toList();
    }

    default String extractPrimaryImageUrl(Product product) {
        if (product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }
        return product.getImages().stream()
                .filter(ProductImage::isPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                .orElseGet(() -> product.getImages().get(0).getImageUrl());
    }
}
