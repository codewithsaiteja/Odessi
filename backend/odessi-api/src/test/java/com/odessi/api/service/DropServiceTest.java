package com.odessi.api.service;

import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.entity.Category;
import com.odessi.api.entity.Product;
import com.odessi.api.mapper.ProductMapper;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.service.impl.DropServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
@DisplayName("DropService unit tests")
class DropServiceTest {

    @Mock ProductRepository productRepository;
    @Mock ProductMapper productMapper;
    @Mock AdminAuditService auditService;
    @Mock AuthService authService;

    DropServiceImpl dropService;

    @BeforeEach
    void setUp() {
        dropService = new DropServiceImpl(productRepository, productMapper, auditService, authService);
    }

    @Test
    @DisplayName("getAdminDrops — fetches products and maps to response inside service boundary")
    void getAdminDrops_success() {
        Product p1 = new Product();
        p1.setId(1L);
        p1.setName("Drop Product 1");
        p1.setPrice(new BigDecimal("1999.00"));
        Category cat = new Category();
        cat.setName("Outerwear");
        p1.setCategory(cat);

        given(productRepository.findAll(any(Pageable.class))).willReturn(new PageImpl<>(List.of(p1)));
        ProductResponse res1 = org.mockito.Mockito.mock(ProductResponse.class);
        given(res1.id()).willReturn(1L);
        given(productMapper.toResponse(p1)).willReturn(res1);

        PagedResponse<ProductResponse> result = dropService.getAdminDrops(0, 20);

        assertThat(result.data()).hasSize(1);
        assertThat(result.data().get(0).id()).isEqualTo(1L);
    }
}
