package com.odessi.api.repository;

import com.odessi.api.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);

    Optional<ProductImage> findByProductIdAndIsPrimaryTrue(Long productId);

    @Modifying
    @Query("UPDATE ProductImage pi SET pi.isPrimary = false WHERE pi.product.id = :productId")
    void clearPrimaryForProduct(Long productId);

    @Modifying
    @Query("UPDATE ProductImage pi SET pi.imageUrl = :newUrl WHERE pi.imageUrl = :oldUrl")
    int updateImageUrl(@org.springframework.data.repository.query.Param("oldUrl") String oldUrl, @org.springframework.data.repository.query.Param("newUrl") String newUrl);
}
