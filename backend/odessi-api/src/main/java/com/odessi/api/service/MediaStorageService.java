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
     * Stores an Instagram or social post image file and returns its public URL path.
     */
    String storeSocialImage(MultipartFile file);

    /**
     * Deletes a product image or video file from storage if present.
     */
    void deleteProductImage(String imageUrl);

    /**
     * Loads a media asset stream by category and filename from private storage.
     *
     * @param category media category, e.g. "products" or "social"
     * @param filename sanitized filename within category, e.g. "prod-123.jpg"
     * @return Optional containing the MediaStream if found, empty if not found
     */
    java.util.Optional<com.odessi.api.dto.media.MediaStream> loadMedia(String category, String filename);
}

