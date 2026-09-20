package com.odessi.api.mapper;

import com.odessi.api.dto.response.ProductVariantResponse;
import com.odessi.api.entity.ProductVariant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProductVariantMapper {

    @Mapping(target = "available", expression = "java(variant.isAvailable())")
    ProductVariantResponse toResponse(ProductVariant variant);
}
