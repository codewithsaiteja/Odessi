package com.odessi.api.service;

import com.odessi.api.dto.response.CategoryResponse;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> findAll();

    CategoryResponse findBySlug(String slug);
}
