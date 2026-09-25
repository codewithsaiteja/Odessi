package com.odessi.api.service;

import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.dto.response.ProductResponse;

import java.util.Map;

public interface DropService {
    PagedResponse<ProductResponse> getAdminDrops(int page, int size);
    ProductResponse configureDrop(Long id, Map<String, Object> body);
}
