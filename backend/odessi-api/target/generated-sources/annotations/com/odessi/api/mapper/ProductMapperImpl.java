package com.odessi.api.mapper;

import com.odessi.api.dto.response.CategoryResponse;
import com.odessi.api.dto.response.CollectionResponse;
import com.odessi.api.dto.response.ProductImageResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.dto.response.ProductSummaryResponse;
import com.odessi.api.dto.response.ProductVariantResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import com.odessi.api.entity.ProductVariant;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-20T00:05:50+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.100.v20260826-1225, environment: Java 21.0.12.1 (Eclipse Adoptium)"
)
@Component
public class ProductMapperImpl implements ProductMapper {

    @Autowired
    private CategoryMapper categoryMapper;
    @Autowired
    private CollectionMapper collectionMapper;
    @Autowired
    private ProductVariantMapper productVariantMapper;
    @Autowired
    private ProductImageMapper productImageMapper;

    @Override
    public ProductResponse toResponse(Product product) {
        if ( product == null ) {
            return null;
        }

        CategoryResponse category = null;
        CollectionResponse collection = null;
        List<ProductVariantResponse> variants = null;
        List<ProductImageResponse> images = null;
        Long id = null;
        String name = null;
        String slug = null;
        String description = null;
        String shortDescription = null;
        BigDecimal price = null;
        BigDecimal compareAtPrice = null;
        String currency = null;
        String material = null;
        String fit = null;
        String careInstructions = null;
        boolean featured = false;
        boolean bestseller = false;
        boolean newArrival = false;
        boolean active = false;
        Instant createdAt = null;
        Instant updatedAt = null;

        category = categoryMapper.toResponse( product.getCategory() );
        collection = collectionMapper.toResponse( product.getCollection() );
        variants = productVariantListToProductVariantResponseList( product.getVariants() );
        images = productImageListToProductImageResponseList( product.getImages() );
        id = product.getId();
        name = product.getName();
        slug = product.getSlug();
        description = product.getDescription();
        shortDescription = product.getShortDescription();
        price = product.getPrice();
        compareAtPrice = product.getCompareAtPrice();
        currency = product.getCurrency();
        material = product.getMaterial();
        fit = product.getFit();
        careInstructions = product.getCareInstructions();
        featured = product.isFeatured();
        bestseller = product.isBestseller();
        newArrival = product.isNewArrival();
        active = product.isActive();
        createdAt = product.getCreatedAt();
        updatedAt = product.getUpdatedAt();

        List<String> imageUrls = extractImageUrls(product);

        ProductResponse productResponse = new ProductResponse( id, name, slug, description, shortDescription, price, compareAtPrice, currency, category, collection, material, fit, careInstructions, featured, bestseller, newArrival, active, variants, images, imageUrls, createdAt, updatedAt );

        return productResponse;
    }

    @Override
    public ProductSummaryResponse toSummaryResponse(Product product) {
        if ( product == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        String slug = null;
        String shortDescription = null;
        BigDecimal price = null;
        BigDecimal compareAtPrice = null;
        String currency = null;
        boolean featured = false;
        boolean bestseller = false;
        boolean newArrival = false;
        boolean active = false;
        Instant createdAt = null;

        id = product.getId();
        name = product.getName();
        slug = product.getSlug();
        shortDescription = product.getShortDescription();
        price = product.getPrice();
        compareAtPrice = product.getCompareAtPrice();
        currency = product.getCurrency();
        featured = product.isFeatured();
        bestseller = product.isBestseller();
        newArrival = product.isNewArrival();
        active = product.isActive();
        createdAt = product.getCreatedAt();

        String categorySlug = product.getCategory() != null ? product.getCategory().getSlug() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;
        String collectionSlug = product.getCollection() != null ? product.getCollection().getSlug() : null;
        boolean hasAvailableVariants = product.getVariants().stream().anyMatch(v -> v.isAvailable());
        List<String> images = extractImageUrls(product);
        String primaryImageUrl = extractPrimaryImageUrl(product);

        ProductSummaryResponse productSummaryResponse = new ProductSummaryResponse( id, name, slug, shortDescription, price, compareAtPrice, currency, categorySlug, categoryName, collectionSlug, featured, bestseller, newArrival, active, hasAvailableVariants, images, primaryImageUrl, createdAt );

        return productSummaryResponse;
    }

    protected List<ProductVariantResponse> productVariantListToProductVariantResponseList(List<ProductVariant> list) {
        if ( list == null ) {
            return null;
        }

        List<ProductVariantResponse> list1 = new ArrayList<ProductVariantResponse>( list.size() );
        for ( ProductVariant productVariant : list ) {
            list1.add( productVariantMapper.toResponse( productVariant ) );
        }

        return list1;
    }

    protected List<ProductImageResponse> productImageListToProductImageResponseList(List<ProductImage> list) {
        if ( list == null ) {
            return null;
        }

        List<ProductImageResponse> list1 = new ArrayList<ProductImageResponse>( list.size() );
        for ( ProductImage productImage : list ) {
            list1.add( productImageMapper.toResponse( productImage ) );
        }

        return list1;
    }
}
