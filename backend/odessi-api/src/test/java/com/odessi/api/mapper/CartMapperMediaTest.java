package com.odessi.api.mapper;

import com.odessi.api.dto.response.CartItemResponse;
import com.odessi.api.entity.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CartMapper Media Resolution Tests")
class CartMapperMediaTest {

    private final CartMapper cartMapper = Mappers.getMapper(CartMapper.class);

    @Test
    @DisplayName("extractItemImageUrl — prefers explicitly designated primary IMAGE")
    void extractItemImageUrl_prefersExplicitPrimaryImage() {
        Product product = new Product();
        product.setId(10L);
        product.setName("Mahesh Babu Hoodie");
        product.setSlug("mahesh-babu-hoodie");

        ProductImage normalImg1 = new ProductImage(product, "/images/mahesh-front.png", "front", 0, false);
        normalImg1.setMediaType("IMAGE");

        ProductImage primaryImg = new ProductImage(product, "/images/mahesh-primary.png", "primary", 1, true);
        primaryImg.setMediaType("IMAGE");

        ProductImage spin360 = new ProductImage(product, "/images/mahesh-360-1.png", "360 frame 1", 0, false);
        spin360.setMediaType("SPIN_360");

        product.setImages(new ArrayList<>(List.of(spin360, normalImg1, primaryImg)));

        ProductVariant variant = new ProductVariant();
        variant.setId(100L);
        variant.setSku("MAHESH-M-BLK");
        variant.setSize("M");
        variant.setColor("Black");
        variant.setPrice(new BigDecimal("1499.00"));
        variant.setProduct(product);

        Cart cart = new Cart();
        CartItem cartItem = new CartItem(cart, variant, 1);

        String resolvedImage = cartMapper.extractItemImageUrl(cartItem);
        assertThat(resolvedImage).isEqualTo("/images/mahesh-primary.png");

        CartItemResponse response = cartMapper.toItemResponse(cartItem);
        assertThat(response.primaryImageUrl()).isEqualTo("/images/mahesh-primary.png");
        assertThat(response.imageUrl()).isEqualTo("/images/mahesh-primary.png");
    }

    @Test
    @DisplayName("extractItemImageUrl — never selects SPIN_360 frame over normal image")
    void extractItemImageUrl_ignoresSpin360Frame() {
        Product product = new Product();
        product.setId(20L);
        product.setName("Kaateramma Koduku Hoodie");
        product.setSlug("kaateramma-koduku-hoodie");

        // SPIN_360 is at sortOrder 0, but is NOT an IMAGE
        ProductImage spinFrame = new ProductImage(product, "/images/360-frame-0.jpg", "spin 0", 0, true);
        spinFrame.setMediaType("SPIN_360");

        // Normal image at sortOrder 1
        ProductImage normalImg = new ProductImage(product, "/images/kaateramma-normal.jpg", "normal", 1, false);
        normalImg.setMediaType("IMAGE");

        product.setImages(new ArrayList<>(List.of(spinFrame, normalImg)));

        ProductVariant variant = new ProductVariant();
        variant.setId(200L);
        variant.setSku("KAAT-M-BLK");
        variant.setSize("M");
        variant.setColor("Black");
        variant.setPrice(new BigDecimal("1299.00"));
        variant.setProduct(product);

        Cart cart = new Cart();
        CartItem cartItem = new CartItem(cart, variant, 2);

        String resolvedImage = cartMapper.extractItemImageUrl(cartItem);
        assertThat(resolvedImage).isEqualTo("/images/kaateramma-normal.jpg");
    }

    @Test
    @DisplayName("extractItemImageUrl — uses lowest sortOrder when no primary image is marked")
    void extractItemImageUrl_usesDeterministicSortOrder() {
        Product product = new Product();
        product.setId(30L);

        ProductImage img2 = new ProductImage(product, "/images/sort-2.jpg", "sort 2", 2, false);
        ProductImage img1 = new ProductImage(product, "/images/sort-1.jpg", "sort 1", 1, false);

        product.setImages(new ArrayList<>(List.of(img2, img1)));

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);

        Cart cart = new Cart();
        CartItem cartItem = new CartItem(cart, variant, 1);

        String resolvedImage = cartMapper.extractItemImageUrl(cartItem);
        assertThat(resolvedImage).isEqualTo("/images/sort-1.jpg");
    }

    @Test
    @DisplayName("extractItemImageUrl — returns null safely when product has no images")
    void extractItemImageUrl_emptyImages_returnsNull() {
        Product product = new Product();
        product.setImages(new ArrayList<>());

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);

        Cart cart = new Cart();
        CartItem cartItem = new CartItem(cart, variant, 1);

        String resolvedImage = cartMapper.extractItemImageUrl(cartItem);
        assertThat(resolvedImage).isNull();
    }

    @Test
    @DisplayName("extractItemImageUrl — matches image based on variant color")
    void extractItemImageUrl_matchesVariantColor() {
        Product product = new Product();
        product.setId(40L);

        ProductImage redImg = new ProductImage(product, "/images/hoodie-red.jpg", "Crimson Red Edition", 0, false);
        redImg.setMediaType("IMAGE");
        ProductImage blueImg = new ProductImage(product, "/images/hoodie-blue.jpg", "Royal Blue Edition", 1, true);
        blueImg.setMediaType("IMAGE");

        product.setImages(new ArrayList<>(List.of(blueImg, redImg)));

        ProductVariant redVariant = new ProductVariant();
        redVariant.setColor("Crimson Red");
        redVariant.setProduct(product);

        Cart cart = new Cart();
        CartItem item = new CartItem(cart, redVariant, 1);

        String resolvedImage = cartMapper.extractItemImageUrl(item);
        assertThat(resolvedImage).isEqualTo("/images/hoodie-red.jpg");
    }

    @Test
    @DisplayName("extractItemImageUrl — ignores IMAGE_TRAIL media type")
    void extractItemImageUrl_ignoresImageTrail() {
        Product product = new Product();
        product.setId(50L);

        ProductImage trailImg = new ProductImage(product, "/images/trail-lookbook.jpg", "Lookbook editorial", 0, true);
        trailImg.setMediaType("IMAGE_TRAIL");

        ProductImage normalImg = new ProductImage(product, "/images/standard-hoodie.jpg", "Standard front", 1, false);
        normalImg.setMediaType("IMAGE");

        product.setImages(new ArrayList<>(List.of(trailImg, normalImg)));

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);

        Cart cart = new Cart();
        CartItem item = new CartItem(cart, variant, 1);

        String resolvedImage = cartMapper.extractItemImageUrl(item);
        assertThat(resolvedImage).isEqualTo("/images/standard-hoodie.jpg");
    }
}
