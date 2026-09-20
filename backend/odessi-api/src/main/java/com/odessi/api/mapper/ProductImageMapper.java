package com.odessi.api.mapper;

import com.odessi.api.dto.response.ProductImageResponse;
import com.odessi.api.entity.ProductImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductImageMapper {

    @Mapping(target = "productId", source = "product.id")
    ProductImageResponse toResponse(ProductImage image);
}
