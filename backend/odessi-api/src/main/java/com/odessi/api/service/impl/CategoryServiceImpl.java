package com.odessi.api.service.impl;

import com.odessi.api.dto.response.CategoryResponse;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.CategoryMapper;
import com.odessi.api.repository.CategoryRepository;
import com.odessi.api.service.CategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryServiceImpl(CategoryRepository categoryRepository, CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
    }

    @Override
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAllByActiveTrue()
            .stream()
            .map(categoryMapper::toResponse)
            .toList();
    }

    @Override
    public CategoryResponse findBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
            .map(categoryMapper::toResponse)
            .orElseThrow(() -> ResourceNotFoundException.category(slug));
    }
}
