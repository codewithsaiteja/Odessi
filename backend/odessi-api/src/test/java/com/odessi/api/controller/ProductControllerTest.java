package com.odessi.api.controller;

import com.odessi.api.config.SecurityConfig;
import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.dto.response.ProductSummaryResponse;
import com.odessi.api.exception.GlobalExceptionHandler;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.security.CustomUserDetailsService;
import com.odessi.api.security.JwtAuthenticationFilter;
import com.odessi.api.security.JwtService;
import com.odessi.api.service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class, AppProperties.class,
         JwtService.class, JwtAuthenticationFilter.class})
@DisplayName("ProductController integration tests")
class ProductControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    ProductService productService;

    @MockBean
    CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("GET /api/products — returns 200 with product list")
    void listProducts_returns200() throws Exception {
        ProductSummaryResponse summary = new ProductSummaryResponse(
            1L, "Shadow Striker Tee", "shadow-striker-tee", "Short desc",
            new BigDecimal("899.00"), new BigDecimal("1299.00"), "INR",
            "tees", "Tees", "dark-verse",
            true, true, false, true, true, List.of(), null, null
        );

        PagedResponse<ProductSummaryResponse> pagedResponse = PagedResponse.of(
            List.of(summary), 0, 20, 1L
        );

        given(productService.findAll(any())).willReturn(pagedResponse);

        mockMvc.perform(get("/api/products").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].slug").value("shadow-striker-tee"))
            .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    @DisplayName("GET /api/products/{slug} — returns 200 with full product")
    void getProduct_returns200() throws Exception {
        ProductResponse product = new ProductResponse(
            1L, "Shadow Striker Tee", "shadow-striker-tee",
            "Description", "Short description",
            new BigDecimal("899.00"), new BigDecimal("1299.00"), "INR",
            null, null,
            "100% Cotton", "Oversized", "Machine wash cold",
            true, true, false, true,
            List.of(), List.of(), List.of(), null, null
        );

        given(productService.findBySlug("shadow-striker-tee")).willReturn(product);

        mockMvc.perform(get("/api/products/shadow-striker-tee").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.slug").value("shadow-striker-tee"))
            .andExpect(jsonPath("$.data.price").value(899.00));
    }

    @Test
    @DisplayName("GET /api/products/{slug} — returns 404 for unknown slug")
    void getProduct_returns404() throws Exception {
        given(productService.findBySlug("nonexistent"))
            .willThrow(ResourceNotFoundException.product("nonexistent"));

        mockMvc.perform(get("/api/products/nonexistent").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("PRODUCT_NOT_FOUND"))
            .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("GET /api/products — supports category filter query param")
    void listProducts_withCategoryFilter() throws Exception {
        given(productService.findAll(argThat(f -> "tees".equals(f.category()))))
            .willReturn(PagedResponse.of(List.of(), 0, 20, 0L));

        mockMvc.perform(get("/api/products?category=tees").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }
}
