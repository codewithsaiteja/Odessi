package com.odessi.api.service;

import com.odessi.api.dto.request.CreateProductRequest;
import com.odessi.api.dto.request.ProductFilterRequest;
import com.odessi.api.dto.request.UpdateProductRequest;
import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.dto.response.ProductSummaryResponse;

public interface ProductService {

    PagedResponse<ProductSummaryResponse> findAll(ProductFilterRequest filter);

    ProductResponse findBySlug(String slug);

    ProductResponse create(CreateProductRequest request);

    ProductResponse update(Long id, UpdateProductRequest request);

    void delete(Long id);
}
