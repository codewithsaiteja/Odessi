package com.odessi.api.mapper;

import com.odessi.api.dto.response.CollectionResponse;
import com.odessi.api.entity.Collection;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CollectionMapper {

    @Mapping(target = "productCount", expression = "java(collection.getProducts().size())")
    CollectionResponse toResponse(Collection collection);
}
