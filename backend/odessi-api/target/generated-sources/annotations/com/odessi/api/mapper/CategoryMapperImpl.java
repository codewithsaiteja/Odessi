package com.odessi.api.mapper;

import com.odessi.api.dto.response.CategoryResponse;
import com.odessi.api.entity.Category;
import java.time.Instant;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-22T00:05:32+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class CategoryMapperImpl implements CategoryMapper {

    @Override
    public CategoryResponse toResponse(Category category) {
        if ( category == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        String slug = null;
        String description = null;
        String image = null;
        boolean active = false;
        Instant createdAt = null;

        id = category.getId();
        name = category.getName();
        slug = category.getSlug();
        description = category.getDescription();
        image = category.getImage();
        active = category.isActive();
        createdAt = category.getCreatedAt();

        int productCount = category.getProducts().size();

        CategoryResponse categoryResponse = new CategoryResponse( id, name, slug, description, image, active, productCount, createdAt );

        return categoryResponse;
    }
}
