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
     * Stores a category image file and returns its canonical public URL path.
     * Path format: /api/media/categories/{filename}
     */
    String storeCategoryImage(MultipartFile file);

    /**
     * Stores a storefront content or editorial image file and returns its canonical public URL path.
     * Path format: /api/media/content/{filename}
     */
    String storeContentImage(MultipartFile file);

    /**
     * Stores a collection cover image file and returns its canonical public URL path.
     * Path format: /api/media/collections/{filename}
     */
    String storeCollectionImage(MultipartFile file);

    /**
     * Deletes a product image or video file from storage if present.
     */
    void deleteProductImage(String imageUrl);

    /**
     * Deletes a category image from storage if present.
     * Safe to call even when imageUrl is null or blank.
     */
    void deleteCategoryImage(String imageUrl);

    /**
     * Deletes a collection image from storage if present.
     * Safe to call even when imageUrl is null or blank.
     */
    void deleteCollectionImage(String imageUrl);

    /**
     * Loads a media asset stream by category and filename from private storage.
     *
     * @param category media category, e.g. "products", "social", or "categories"
     * @param filename sanitized filename within category, e.g. "cat-123.jpg"
     * @return Optional containing the MediaStream if found, empty if not found
     */
    java.util.Optional<com.odessi.api.dto.media.MediaStream> loadMedia(String category, String filename);
}


