package com.odessi.api.service;

import org.springframework.web.multipart.MultipartFile;

public interface MediaStorageService {

    /**
     * Stores a product image file and returns its public URL path.
     */
    String storeProductImage(MultipartFile file);

    /**
     * Stores a product video file and returns its public URL path.
     */
    String storeProductVideo(MultipartFile file);

    /**
     * Deletes a product image or video file from storage if present.
     */
    void deleteProductImage(String imageUrl);
}
