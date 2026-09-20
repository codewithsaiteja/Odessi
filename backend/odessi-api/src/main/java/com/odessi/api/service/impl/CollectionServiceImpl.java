package com.odessi.api.service.impl;

import com.odessi.api.dto.response.CollectionResponse;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.CollectionMapper;
import com.odessi.api.repository.CollectionRepository;
import com.odessi.api.service.CollectionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CollectionServiceImpl implements CollectionService {

    private final CollectionRepository collectionRepository;
    private final CollectionMapper collectionMapper;

    public CollectionServiceImpl(CollectionRepository collectionRepository, CollectionMapper collectionMapper) {
        this.collectionRepository = collectionRepository;
        this.collectionMapper = collectionMapper;
    }

    @Override
    public List<CollectionResponse> findAll() {
        return collectionRepository.findAllByActiveTrue()
            .stream()
            .map(collectionMapper::toResponse)
            .toList();
    }

    @Override
    public CollectionResponse findBySlug(String slug) {
        return collectionRepository.findBySlug(slug)
            .map(collectionMapper::toResponse)
            .orElseThrow(() -> ResourceNotFoundException.collection(slug));
    }
}
