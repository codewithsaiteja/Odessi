package com.odessi.api.service;

import com.odessi.api.dto.response.CollectionResponse;

import java.util.List;

public interface CollectionService {

    List<CollectionResponse> findAll();

    CollectionResponse findBySlug(String slug);
}
