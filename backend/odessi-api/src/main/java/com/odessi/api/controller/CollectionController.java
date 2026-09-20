package com.odessi.api.controller;

import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.CollectionResponse;
import com.odessi.api.service.CollectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
@Tag(name = "Collections", description = "Product collection endpoints")
public class CollectionController {

    private final CollectionService collectionService;

    public CollectionController(CollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @GetMapping
    @Operation(summary = "List all active collections")
    public ResponseEntity<ApiResponse<List<CollectionResponse>>> listCollections() {
        return ResponseEntity.ok(ApiResponse.ok(collectionService.findAll()));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get collection by slug")
    public ResponseEntity<ApiResponse<CollectionResponse>> getCollection(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(collectionService.findBySlug(slug)));
    }
}
