package com.odessi.api.mapper;

import com.odessi.api.dto.response.CategoryResponse;
import com.odessi.api.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct mapper — generates implementation at compile time.
 * componentModel = "spring" makes this a Spring bean.
 */
@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "productCount", expression = "java(category.getProducts().size())")
    CategoryResponse toResponse(Category category);
}
