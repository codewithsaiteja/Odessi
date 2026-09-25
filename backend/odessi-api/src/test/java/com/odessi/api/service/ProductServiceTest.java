package com.odessi.api.service;

import com.odessi.api.dto.request.ProductFilterRequest;
import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.dto.response.ProductSummaryResponse;
import com.odessi.api.entity.Category;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductVariant;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.ProductMapper;
import com.odessi.api.repository.CategoryRepository;
import com.odessi.api.repository.CollectionRepository;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.repository.ProductReviewRepository;
import com.odessi.api.repository.ProductVariantRepository;
import com.odessi.api.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService unit tests")
class ProductServiceTest {

    @Mock ProductRepository productRepository;
    @Mock ProductVariantRepository variantRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock CollectionRepository collectionRepository;
    @Mock ProductReviewRepository reviewRepository;
    @Mock ProductMapper productMapper;

    ProductServiceImpl productService;

    @BeforeEach
    void setUp() {
        productService = new ProductServiceImpl(
            productRepository, variantRepository,
            categoryRepository, collectionRepository,
            reviewRepository,
            productMapper
        );
    }

    // ── findBySlug ────────────────────────────────────────────────

    @Test
    @DisplayName("findBySlug — returns ProductResponse with ratings when product exists")
    void findBySlug_found() {
        Product product = buildProduct("shadow-striker-tee");
        ProductResponse response = buildProductResponse("shadow-striker-tee");

        given(productRepository.findBySlugWithVariants("shadow-striker-tee"))
            .willReturn(Optional.of(product));
        given(productMapper.toResponse(product)).willReturn(response);
        given(reviewRepository.getAverageRatingForProduct(any())).willReturn(4.5);
        given(reviewRepository.countApprovedReviewsForProduct(any())).willReturn(3L);

        ProductResponse result = productService.findBySlug("shadow-striker-tee");

        assertThat(result).isNotNull();
        assertThat(result.slug()).isEqualTo("shadow-striker-tee");
        assertThat(result.averageRating()).isEqualTo(4.5);
        assertThat(result.reviewCount()).isEqualTo(3);
    }

    @Test
    @DisplayName("findBySlug — throws ResourceNotFoundException when product not found")
    void findBySlug_notFound() {
        given(productRepository.findBySlugWithVariants("nonexistent"))
            .willReturn(Optional.empty());

        assertThatThrownBy(() -> productService.findBySlug("nonexistent"))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("nonexistent");
    }

    // ── findAll (pagination) ──────────────────────────────────────

    @Test
    @DisplayName("findAll — returns paged results with ratings")
    void findAll_returnsPagedResults() {
        Product p1 = buildProduct("product-1");
        p1.setId(1L);
        Product p2 = buildProduct("product-2");
        p2.setId(2L);

        given(productRepository.findAll(any(Specification.class), any(Pageable.class)))
            .willReturn(new PageImpl<>(List.of(p1, p2)));

        given(productMapper.toSummaryResponse(p1))
            .willReturn(new ProductSummaryResponse(
                1L, "Product 1", "product-1", null,
                new BigDecimal("999.00"), null, "INR",
                "tees", "Tees", null,
                false, false, false, true, true, List.of(), null, null
            ));
        given(productMapper.toSummaryResponse(p2))
            .willReturn(new ProductSummaryResponse(
                2L, "Product 2", "product-2", null,
                new BigDecimal("999.00"), null, "INR",
                "tees", "Tees", null,
                false, false, false, true, true, List.of(), null, null
            ));

        given(reviewRepository.getRatingAggregatesForProducts(List.of(1L, 2L)))
            .willReturn(List.<Object[]>of(new Object[]{1L, 4.8, 5L}));

        ProductFilterRequest filter = new ProductFilterRequest(
            null, null, null, null,
            null, null,
            null, null, null, null,
            null, "newest", 0, 20
        );

        PagedResponse<ProductSummaryResponse> result = productService.findAll(filter);

        assertThat(result.data()).hasSize(2);
        assertThat(result.page()).isEqualTo(0);
        assertThat(result.data().get(0).averageRating()).isEqualTo(4.8);
        assertThat(result.data().get(0).reviewCount()).isEqualTo(5);
        assertThat(result.data().get(1).averageRating()).isNull();
        assertThat(result.data().get(1).reviewCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("findAll — page size capped at 100")
    void findAll_capPageSize() {
        given(productRepository.findAll(any(Specification.class), any(Pageable.class)))
            .willReturn(new PageImpl<>(List.of()));

        ProductFilterRequest filter = new ProductFilterRequest(
            null, null, null, null,
            null, null,
            null, null, null, null,
            null, "newest", 0, 9999  // request huge page
        );

        // Should not throw — just capped internally
        assertThatNoException().isThrownBy(() -> productService.findAll(filter));

        then(productRepository).should().findAll(
            any(Specification.class),
            argThat((Pageable p) -> p.getPageSize() <= 100)
        );
    }

    // ── delete (soft delete) ──────────────────────────────────────

    @Test
    @DisplayName("delete — sets active=false (soft delete)")
    void delete_softDeletesProduct() {
        Product product = buildProduct("test-product");
        product.setActive(true);

        given(productRepository.findById(1L)).willReturn(Optional.of(product));
        given(productRepository.save(any())).willReturn(product);

        productService.delete(1L);

        assertThat(product.isActive()).isFalse();
    }

    @Test
    @DisplayName("delete — throws ResourceNotFoundException for missing product")
    void delete_throwsWhenNotFound() {
        given(productRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> productService.delete(99L))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── Helpers ───────────────────────────────────────────────────

    private Product buildProduct(String slug) {
        Category cat = new Category("Tees", "tees", null, null);
        Product p = new Product();
        p.setName("Test Product");
        p.setSlug(slug);
        p.setPrice(new BigDecimal("999.00"));
        p.setCurrency("INR");
        p.setActive(true);
        p.setCategory(cat);
        return p;
    }

    private ProductResponse buildProductResponse(String slug) {
        return new ProductResponse(
            1L, "Test Product", slug, null, null,
            new BigDecimal("999.00"), null, "INR",
            null, null, null, null, null,
            false, false, false, true,
            List.of(), List.of(), List.of(), null, null
        );
    }

    private ProductSummaryResponse buildSummary(String slug) {
        return new ProductSummaryResponse(
            1L, "Test Product", slug, null,
            new BigDecimal("999.00"), null, "INR",
            "tees", "Tees", null,
            false, false, false, true, true, List.of(), null, null
        );
    }
}
