package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminProductRequest;
import com.odessi.api.dto.response.ProductImageResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.entity.Category;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.*;
import com.odessi.api.repository.*;
import com.odessi.api.service.impl.AdminServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminProductMediaService Unit Tests")
class AdminProductMediaServiceTest {

    @Mock ProductRepository productRepository;
    @Mock ProductVariantRepository variantRepository;
    @Mock ProductImageRepository productImageRepository;
    @Mock CategoryRepository categoryRepository;
    @Mock CollectionRepository collectionRepository;
    @Mock OrderRepository orderRepository;
    @Mock UserRepository userRepository;
    @Mock InventoryLogRepository inventoryLogRepository;
    @Mock AdminAuditService auditService;
    @Mock MediaStorageService mediaStorageService;
    @Mock NotificationService notificationService;

    @Mock ProductMapper productMapper;
    @Mock ProductVariantMapper variantMapper;
    @Mock ProductImageMapper productImageMapper;
    @Mock OrderMapper orderMapper;
    @Mock AddressMapper addressMapper;
    @Mock CategoryMapper categoryMapper;
    @Mock CollectionMapper collectionMapper;

    AdminServiceImpl adminService;
    User mockAdmin;

    @BeforeEach
    void setUp() {
        adminService = new AdminServiceImpl(
            productRepository, variantRepository, productImageRepository,
            categoryRepository, collectionRepository, orderRepository, userRepository,
            inventoryLogRepository, auditService, mediaStorageService, notificationService,
            productMapper, variantMapper, productImageMapper, orderMapper,
            addressMapper, categoryMapper, collectionMapper
        );
        mockAdmin = new User();
        mockAdmin.setId(1L);
        mockAdmin.setEmail("admin@odessi.tfi");
    }

    @Test
    @DisplayName("Create product — succeeds with valid category")
    void createProduct_succeeds() {
        Category cat = new Category("T-Shirts", "t-shirts", null, null);
        cat.setId(10L);

        AdminProductRequest req = new AdminProductRequest(
            "Cinematic Oversized Tee", "cinematic-oversized-tee", "Desc", "Short",
            new BigDecimal("1299.00"), new BigDecimal("1699.00"), "INR", 10L, null,
            "Cotton", "Oversized", "Cold wash", true, false, true, true, List.of()
        );

        given(productRepository.existsBySlug("cinematic-oversized-tee")).willReturn(false);
        given(categoryRepository.findById(10L)).willReturn(Optional.of(cat));
        given(productRepository.save(any())).willAnswer(inv -> {
            Product p = inv.getArgument(0);
            p.setId(100L);
            return p;
        });

        ProductResponse response = new ProductResponse(
            100L, "Cinematic Oversized Tee", "cinematic-oversized-tee", "Desc", "Short",
            new BigDecimal("1299.00"), new BigDecimal("1699.00"), "INR",
            null, null, "Cotton", "Oversized", "Cold wash",
            true, false, true, true, List.of(), List.of(), List.of(), null, null
        );
        given(productMapper.toResponse(any())).willReturn(response);

        ProductResponse result = adminService.createProduct(mockAdmin, req);
        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(100L);
    }

    @Test
    @DisplayName("Create product — fails on duplicate slug")
    void createProduct_duplicateSlug_throwsException() {
        AdminProductRequest req = new AdminProductRequest(
            "Cinematic Oversized Tee", "cinematic-oversized-tee", "Desc", null,
            new BigDecimal("1299.00"), null, "INR", 10L, null,
            null, null, null, false, false, false, true, List.of()
        );

        given(productRepository.existsBySlug("cinematic-oversized-tee")).willReturn(true);

        assertThatThrownBy(() -> adminService.createProduct(mockAdmin, req))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Product slug already exists");
    }

    @Test
    @DisplayName("Create product — fails on invalid category")
    void createProduct_invalidCategory_throwsException() {
        AdminProductRequest req = new AdminProductRequest(
            "Cinematic Oversized Tee", "cinematic-oversized-tee", "Desc", null,
            new BigDecimal("1299.00"), null, "INR", 999L, null,
            null, null, null, false, false, false, true, List.of()
        );

        given(productRepository.existsBySlug("cinematic-oversized-tee")).willReturn(false);
        given(categoryRepository.findById(999L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> adminService.createProduct(mockAdmin, req))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("Category not found: 999");
    }

    @Test
    @DisplayName("Upload image — rejects invalid file type")
    void uploadImage_invalidFileType_throwsException() {
        MockMultipartFile file = new MockMultipartFile(
            "file", "script.exe", "application/octet-stream", "evil binary content".getBytes()
        );

        Product product = new Product();
        product.setId(100L);
        given(productRepository.findById(100L)).willReturn(Optional.of(product));
        given(mediaStorageService.storeProductImage(any())).willThrow(new BadRequestException("INVALID_FILE_TYPE", "Only JPG, PNG, and WEBP image formats are supported"));

        assertThatThrownBy(() -> adminService.uploadProductImage(mockAdmin, 100L, file, "alt", false))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Only JPG, PNG, and WEBP");
    }

    @Test
    @DisplayName("Upload image — associates image and sets primary if first image")
    void uploadImage_success() {
        Product product = new Product();
        product.setId(100L);
        product.setImages(new ArrayList<>());

        MockMultipartFile file = new MockMultipartFile(
            "file", "test.png", "image/png", "png content".getBytes()
        );

        given(productRepository.findById(100L)).willReturn(Optional.of(product));
        given(mediaStorageService.storeProductImage(any(MultipartFile.class))).willReturn("/uploads/products/test.png");
        given(productImageRepository.save(any())).willAnswer(inv -> {
            ProductImage img = inv.getArgument(0);
            img.setId(1L);
            return img;
        });

        ProductImageResponse imgResp = new ProductImageResponse(1L, 100L, "/uploads/products/test.png", "alt", 0, true, "IMAGE", null, null, null);
        given(productImageMapper.toResponse(any())).willReturn(imgResp);

        ProductImageResponse result = adminService.uploadProductImage(mockAdmin, 100L, file, "alt", false);
        assertThat(result).isNotNull();
        assertThat(result.isPrimary()).isTrue();
    }

    @Test
    @DisplayName("Upload image — supports SPIN_360 mediaType for 360 sequence frames")
    void uploadImage_360SpinMedia_preservesMediaType() {
        Product product = new Product();
        product.setId(100L);
        product.setImages(new ArrayList<>());

        MockMultipartFile file = new MockMultipartFile(
            "file", "frame-1.webp", "image/webp", "webp frame content".getBytes()
        );

        given(productRepository.findById(100L)).willReturn(Optional.of(product));
        given(mediaStorageService.storeProductImage(any(MultipartFile.class))).willReturn("/uploads/products/frame-1.webp");
        given(productImageRepository.save(any())).willAnswer(inv -> {
            ProductImage img = inv.getArgument(0);
            img.setId(5L);
            return img;
        });

        ProductImageResponse imgResp = new ProductImageResponse(5L, 100L, "/uploads/products/frame-1.webp", "frame 1", 0, false, "SPIN_360", null, null, null);
        given(productImageMapper.toResponse(any())).willReturn(imgResp);

        ProductImageResponse result = adminService.uploadProductImage(mockAdmin, 100L, file, "frame 1", false, "SPIN_360");
        assertThat(result).isNotNull();
        assertThat(result.mediaType()).isEqualTo("SPIN_360");
        assertThat(result.isPrimary()).isFalse();
    }

    @Test
    @DisplayName("Set primary image — clears previous primary and sets new primary")
    void setPrimaryImage_success() {
        Product product = new Product();
        product.setId(100L);

        ProductImage img = new ProductImage();
        img.setId(2L);
        img.setProduct(product);
        img.setPrimary(false);

        given(productRepository.findById(100L)).willReturn(Optional.of(product));
        given(productImageRepository.findById(2L)).willReturn(Optional.of(img));
        given(productMapper.toResponse(product)).willReturn(new ProductResponse(
            100L, "Product", "product", null, null, BigDecimal.TEN, null, "INR",
            null, null, null, null, null, false, false, false, true, List.of(), List.of(), List.of(), null, null
        ));

        ProductResponse result = adminService.setPrimaryProductImage(mockAdmin, 100L, 2L);
        assertThat(result).isNotNull();
        then(productImageRepository).should().clearPrimaryForProduct(100L);
        assertThat(img.isPrimary()).isTrue();
    }

    @Test
    @DisplayName("Cross-product media access — setPrimary throws Exception if image belongs to another product")
    void crossProductMediaAccess_throwsException() {
        Product product1 = new Product();
        product1.setId(100L);

        Product product2 = new Product();
        product2.setId(200L);

        ProductImage imgOther = new ProductImage();
        imgOther.setId(99L);
        imgOther.setProduct(product2);

        given(productRepository.findById(100L)).willReturn(Optional.of(product1));
        given(productImageRepository.findById(99L)).willReturn(Optional.of(imgOther));

        assertThatThrownBy(() -> adminService.setPrimaryProductImage(mockAdmin, 100L, 99L))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Image does not belong to product");
    }

    @Test
    @DisplayName("Delete media — deletes file and database record")
    void deleteMedia_success() {
        Product product = new Product();
        product.setId(100L);

        ProductImage img = new ProductImage();
        img.setId(1L);
        img.setProduct(product);
        img.setImageUrl("/uploads/products/photo.jpg");
        img.setPrimary(false);

        given(productRepository.findById(100L)).willReturn(Optional.of(product));
        given(productImageRepository.findById(1L)).willReturn(Optional.of(img));

        adminService.deleteProductImage(mockAdmin, 100L, 1L);

        then(mediaStorageService).should().deleteProductImage("/uploads/products/photo.jpg");
        then(productImageRepository).should().delete(img);
    }
}
