package com.odessi.api.mapper;

import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ProductMapper Media Isolation Tests")
class ProductMapperMediaTest {

    private final ProductMapper productMapper = Mappers.getMapper(ProductMapper.class);

    @Test
    @DisplayName("extractImageUrls — returns only standard IMAGE media, excluding SPIN_360 and VIDEO")
    void extractImageUrls_excludesSpin360AndVideo() {
        Product product = new Product();
        product.setId(1L);
        product.setName("Paradise Graphic Tee");
        product.setSlug("paradise-tee");

        ProductImage normalImg1 = new ProductImage(product, "/images/paradise-front.png", "front", 0, true);
        normalImg1.setMediaType("IMAGE");

        ProductImage normalImg2 = new ProductImage(product, "/images/paradise-back.png", "back", 1, false);
        normalImg2.setMediaType("DEFAULT");

        ProductImage spinFrame1 = new ProductImage(product, "/images/paradise-360-1.png", "spin 1", 0, false);
        spinFrame1.setMediaType("SPIN_360");

        ProductImage trailImg = new ProductImage(product, "/images/paradise-trail.png", "trail", 0, false);
        trailImg.setMediaType("IMAGE_TRAIL");

        ProductImage video = new ProductImage(product, "/videos/paradise-reel.mp4", "video", 0, false);
        video.setMediaType("VIDEO");

        product.setImages(new ArrayList<>(List.of(spinFrame1, normalImg1, trailImg, normalImg2, video)));

        List<String> imageUrls = productMapper.extractImageUrls(product);
        assertThat(imageUrls).containsExactly("/images/paradise-front.png", "/images/paradise-back.png");
    }

    @Test
    @DisplayName("extractPrimaryImageUrl — prefers designated primary IMAGE and ignores SPIN_360 even if marked primary")
    void extractPrimaryImageUrl_ignoresSpin360EvenIfMarkedPrimary() {
        Product product = new Product();
        product.setId(2L);
        product.setName("Neon Cyber Jacket");
        product.setSlug("neon-cyber-jacket");

        ProductImage fakePrimarySpin = new ProductImage(product, "/images/spin-01.png", "fake spin primary", 0, true);
        fakePrimarySpin.setMediaType("SPIN_360");

        ProductImage regularImg = new ProductImage(product, "/images/jacket-main.png", "main", 1, false);
        regularImg.setMediaType("IMAGE");

        product.setImages(new ArrayList<>(List.of(fakePrimarySpin, regularImg)));

        String primaryUrl = productMapper.extractPrimaryImageUrl(product);
        assertThat(primaryUrl).isEqualTo("/images/jacket-main.png");
    }

    @Test
    @DisplayName("extractPrimaryImageUrl — returns null when product only contains SPIN_360 media")
    void extractPrimaryImageUrl_returnsNullWhenOnlySpin360Exists() {
        Product product = new Product();
        product.setId(3L);
        product.setName("Only Spin Product");
        product.setSlug("only-spin");

        ProductImage spin1 = new ProductImage(product, "/images/spin-1.png", "spin 1", 0, true);
        spin1.setMediaType("SPIN_360");
        ProductImage spin2 = new ProductImage(product, "/images/spin-2.png", "spin 2", 1, false);
        spin2.setMediaType("SPIN_360");

        product.setImages(new ArrayList<>(List.of(spin1, spin2)));

        String primaryUrl = productMapper.extractPrimaryImageUrl(product);
        assertThat(primaryUrl).isNull();
    }
}
