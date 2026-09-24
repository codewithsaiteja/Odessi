package com.odessi.api.runner;

import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import com.odessi.api.entity.SocialPost;
import com.odessi.api.repository.ProductImageRepository;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.repository.SocialPostRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

@SpringBootTest
@ActiveProfiles("test")
public class SeedSyncDbServiceTest {

    @Autowired
    private SeedSyncDbService seedSyncDbService;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private SocialPostRepository socialPostRepository;

    @Autowired
    private ProductRepository productRepository;

    @Test
    @DisplayName("SeedSyncDbService can update ProductImage URL within a transaction without throwing 'Executing an update/delete query'")
    void updateProductImageUrl_executesWithoutTransactionError() {
        // Prepare test data
        Product product = new Product();
        product.setName("Test Product");
        product.setSlug("test-product-seedsync");
        product.setDescription("Test desc");
        product.setPrice(new BigDecimal("999.00"));
        product.setCurrency("INR");
        product = productRepository.save(product);

        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setImageUrl("/uploads/products/test-image.jpg");
        image.setSortOrder(0);
        productImageRepository.save(image);

        // Verify update succeeds without throwing an exception (like it does when missing @Transactional)
        assertThatCode(() -> {
            int count = seedSyncDbService.updateProductImageUrl("/uploads/products/test-image.jpg", "https://azure.blob/products/test-image.jpg");
            assertThat(count).isEqualTo(1);
        }).doesNotThrowAnyException();

        // Verify value was actually updated
        ProductImage updated = productImageRepository.findById(image.getId()).orElseThrow();
        assertThat(updated.getImageUrl()).isEqualTo("https://azure.blob/products/test-image.jpg");
    }

    @Test
    @DisplayName("SeedSyncDbService can update SocialPost media URL within a transaction without throwing 'Executing an update/delete query'")
    void updateSocialMediaUrl_executesWithoutTransactionError() {
        // Prepare test data
        SocialPost post = new SocialPost();
        post.setMediaUrl("/uploads/social/test-social.jpg");
        post.setInstagramUrl("https://instagram.com/p/test");
        post.setDisplayOrder(0);
        socialPostRepository.save(post);

        // Verify update succeeds without throwing an exception
        assertThatCode(() -> {
            int count = seedSyncDbService.updateSocialMediaUrl("/uploads/social/test-social.jpg", "https://azure.blob/social/test-social.jpg");
            assertThat(count).isEqualTo(1);
        }).doesNotThrowAnyException();

        // Verify value was actually updated
        SocialPost updated = socialPostRepository.findById(post.getId()).orElseThrow();
        assertThat(updated.getMediaUrl()).isEqualTo("https://azure.blob/social/test-social.jpg");
    }
}
