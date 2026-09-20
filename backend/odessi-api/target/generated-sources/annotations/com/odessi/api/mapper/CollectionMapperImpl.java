package com.odessi.api.mapper;

import com.odessi.api.dto.response.CollectionResponse;
import com.odessi.api.entity.Collection;
import java.time.Instant;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-20T00:05:49+0530",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.100.v20260826-1225, environment: Java 21.0.12.1 (Eclipse Adoptium)"
)
@Component
public class CollectionMapperImpl implements CollectionMapper {

    @Override
    public CollectionResponse toResponse(Collection collection) {
        if ( collection == null ) {
            return null;
        }

        Long id = null;
        String name = null;
        String slug = null;
        String description = null;
        String heroImage = null;
        boolean active = false;
        boolean featured = false;
        Instant createdAt = null;

        id = collection.getId();
        name = collection.getName();
        slug = collection.getSlug();
        description = collection.getDescription();
        heroImage = collection.getHeroImage();
        active = collection.isActive();
        featured = collection.isFeatured();
        createdAt = collection.getCreatedAt();

        int productCount = collection.getProducts().size();

        CollectionResponse collectionResponse = new CollectionResponse( id, name, slug, description, heroImage, active, featured, productCount, createdAt );

        return collectionResponse;
    }
}
