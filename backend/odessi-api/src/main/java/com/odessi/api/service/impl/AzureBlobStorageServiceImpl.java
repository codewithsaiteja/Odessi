package com.odessi.api.service.impl;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.service.MediaStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;

/**
 * Azure Blob Storage implementation of {@link MediaStorageService}.
 *
 * <p>Used when {@code AZURE_STORAGE_CONNECTION_STRING} is configured.
 * Returns permanent HTTPS Azure Blob URLs.
 *
 * <p>Security notes:
 * <ul>
 *   <li>Connection string is read server-side only. Never exposed to the frontend.</li>
 *   <li>Client-provided filenames are never trusted; safe names are generated server-side.</li>
 *   <li>MIME type and file extension are validated before storing.</li>
 * </ul>
 */
public class AzureBlobStorageServiceImpl implements MediaStorageService {

    private static final Logger log = LoggerFactory.getLogger(AzureBlobStorageServiceImpl.class);

    private static final long MAX_IMAGE_SIZE = 10L * 1024 * 1024;   // 10 MB
    private static final long MAX_VIDEO_SIZE = 50L * 1024 * 1024;   // 50 MB

    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    private static final List<String> ALLOWED_VIDEO_TYPES = List.of(
            "video/mp4", "video/webm", "video/quicktime", "video/ogg"
    );

    private final BlobContainerClient containerClient;
    private final String blobBaseUrl;

    public AzureBlobStorageServiceImpl(String connectionString, String containerName) {
        BlobServiceClient serviceClient = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();

        this.containerClient = serviceClient.getBlobContainerClient(containerName);
        // Create container if it doesn't exist (idempotent on Render startup)
        if (!containerClient.exists()) {
            containerClient.create();
            log.info("[Azure] Created blob container: {}", containerName);
        }

        // Derive base URL from client (format: https://account.blob.core.windows.net/container)
        this.blobBaseUrl = containerClient.getBlobContainerUrl();
        log.info("[Azure] AzureBlobStorageServiceImpl active — container: {}", blobBaseUrl);
    }

    // ─── Product Image ────────────────────────────────────────────────────────

    @Override
    public String storeProductImage(MultipartFile file) {
        validateImage(file);
        String blobName = "products/" + safeFileName(file.getOriginalFilename(), resolveImageExtension(file));
        return uploadBlob(blobName, file, file.getContentType());
    }

    // ─── Product Video ────────────────────────────────────────────────────────

    @Override
    public String storeProductVideo(MultipartFile file) {
        validateVideo(file);
        String blobName = "products/" + safeFileName(file.getOriginalFilename(), resolveVideoExtension(file));
        return uploadBlob(blobName, file, file.getContentType());
    }

    // ─── Social Image ─────────────────────────────────────────────────────────

    @Override
    public String storeSocialImage(MultipartFile file) {
        validateImage(file);
        String blobName = "social/" + safeFileName(file.getOriginalFilename(), resolveImageExtension(file));
        return uploadBlob(blobName, file, file.getContentType());
    }

    // ─── Delete Product Image ─────────────────────────────────────────────────

    @Override
    public void deleteProductImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;

        // Extract blob name from the full Azure URL
        // e.g. https://account.blob.core.windows.net/media/products/xyz.jpg → products/xyz.jpg
        try {
            String blobName = extractBlobName(imageUrl);
            if (blobName == null) {
                log.warn("[Azure] Cannot derive blob name from URL: {}", imageUrl);
                return;
            }
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            if (blobClient.exists()) {
                blobClient.delete();
                log.info("[Azure] Deleted blob: {}", blobName);
            } else {
                log.warn("[Azure] Blob not found for deletion: {}", blobName);
            }
        } catch (Exception e) {
            log.warn("[Azure] Failed to delete blob for URL {}: {}", imageUrl, e.getMessage());
        }
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────

    /**
     * Upload a multipart file to Azure Blob Storage.
     *
     * @param blobName    relative blob path within container, e.g. "products/prod-1234.webp"
     * @param file        multipart file
     * @param contentType MIME type to set in blob HTTP headers
     * @return full HTTPS Azure Blob URL
     */
    private String uploadBlob(String blobName, MultipartFile file, String contentType) {
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        BlobHttpHeaders headers = new BlobHttpHeaders().setContentType(contentType);
        try (InputStream is = file.getInputStream()) {
            blobClient.upload(is, file.getSize(), true);
            blobClient.setHttpHeaders(headers);
            String url = blobClient.getBlobUrl();
            log.info("[Azure] Uploaded blob {} ({} bytes) → {}", blobName, file.getSize(), url);
            return url;
        } catch (IOException e) {
            log.error("[Azure] Failed to upload blob {}: {}", blobName, e.getMessage(), e);
            throw new BadRequestException("STORAGE_ERROR", "Failed to upload file to storage. Please try again.");
        }
    }

    /**
     * Generate a collision-resistant, sanitized filename.
     * Never uses the client-provided name directly.
     *
     * @param originalFilename raw client filename (untrusted)
     * @param extension        validated extension (.jpg, .png, etc.)
     * @return safe filename: prod-{timestamp}-{uuid8}{extension}
     */
    private String safeFileName(String originalFilename, String extension) {
        return "prod-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8) + extension;
    }

    /**
     * Resolve and validate image extension from content type.
     */
    private String resolveImageExtension(MultipartFile file) {
        String ct = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        return switch (ct) {
            case "image/png"  -> ".png";
            case "image/webp" -> ".webp";
            default           -> ".jpg";
        };
    }

    /**
     * Resolve and validate video extension from content type.
     */
    private String resolveVideoExtension(MultipartFile file) {
        String ct = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        return switch (ct) {
            case "video/webm"     -> ".webm";
            case "video/quicktime"-> ".mov";
            default               -> ".mp4";
        };
    }

    /**
     * Extract the blob name (path within container) from a full Azure Blob URL.
     * Returns null if the URL is not a valid Azure Blob URL for this container.
     */
    private String extractBlobName(String url) {
        String prefix = blobBaseUrl + "/";
        if (url.startsWith(prefix)) {
            return url.substring(prefix.length());
        }
        // Also handle /uploads/ legacy format — not applicable for Azure but guard anyway
        return null;
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("INVALID_FILE", "Upload file cannot be empty");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new BadRequestException("FILE_TOO_LARGE", "Image size cannot exceed 10 MB");
        }
        String ct = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        if (!ALLOWED_IMAGE_TYPES.contains(ct)) {
            throw new BadRequestException("INVALID_FILE_TYPE", "Only JPG, PNG, and WEBP images are allowed");
        }
    }

    private void validateVideo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("INVALID_FILE", "Upload file cannot be empty");
        }
        if (file.getSize() > MAX_VIDEO_SIZE) {
            throw new BadRequestException("FILE_TOO_LARGE", "Video size cannot exceed 50 MB");
        }
        String ct = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        if (!ALLOWED_VIDEO_TYPES.contains(ct)) {
            throw new BadRequestException("INVALID_FILE_TYPE", "Only MP4, WEBM, and MOV videos are allowed");
        }
    }
}
