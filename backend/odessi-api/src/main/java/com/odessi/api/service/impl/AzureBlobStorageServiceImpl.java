package com.odessi.api.service.impl;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.models.BlobProperties;
import com.odessi.api.dto.media.MediaStream;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.service.MediaStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Azure Blob Storage implementation of {@link MediaStorageService}.
 *
 * <p>Used when {@code AZURE_STORAGE_CONNECTION_STRING} is configured.
 * Stores blobs securely in a private Azure Blob Storage container.
 *
 * <p>Security & Access Architecture:
 * <ul>
 *   <li>The Azure storage account and media container remain 100% private. Anonymous public
 *       access on Azure is never required and should remain disabled.</li>
 *   <li>Storefront media requests are routed through the authenticated Spring Boot gateway at
 *       {@code /api/media/{category}/{filename}}.</li>
 *   <li>Connection strings and account keys never leave the server environment.</li>
 *   <li>Client-provided filenames are sanitized and replaced with cryptographically random names.</li>
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
            log.info("[Azure] Created private blob container: {}", containerName);
        }

        // Derive base URL from client (format: https://account.blob.core.windows.net/container)
        this.blobBaseUrl = containerClient.getBlobContainerUrl();
        log.info("[Azure] AzureBlobStorageServiceImpl active — private container: {}", blobBaseUrl);
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

    // ─── Category Image ───────────────────────────────────────────────────────

    @Override
    public String storeCategoryImage(MultipartFile file) {
        validateImage(file);
        String blobName = "categories/" + safeCategoryFileName(file.getOriginalFilename(), resolveImageExtension(file));
        return uploadBlob(blobName, file, file.getContentType());
    }

    // ─── Storefront / Content Image ──────────────────────────────────────────

    @Override
    public String storeContentImage(MultipartFile file) {
        validateImage(file);
        String blobName = "content/" + safeContentFileName(file.getOriginalFilename(), resolveImageExtension(file));
        return uploadBlob(blobName, file, file.getContentType());
    }


    @Override
    public Optional<MediaStream> loadMedia(String category, String filename) {
        if (category == null || filename == null) {
            return Optional.empty();
        }

        String safeCategory = category.trim().toLowerCase();
        if (!"products".equals(safeCategory) && !"social".equals(safeCategory) && !"categories".equals(safeCategory) && !"content".equals(safeCategory)) {
            return Optional.empty();
        }

        String safeFilename = filename.trim();
        // Prevent path traversal
        if (safeFilename.contains("..") || safeFilename.contains("/") || safeFilename.contains("\\")) {
            log.warn("[Azure] Directory traversal attempt detected: category={}, filename={}", category, filename);
            return Optional.empty();
        }

        String blobName = safeCategory + "/" + safeFilename;
        try {
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            if (!blobClient.exists()) {
                return Optional.empty();
            }

            BlobProperties properties = blobClient.getProperties();
            String contentType = properties.getContentType();
            if (contentType == null || contentType.isBlank() || "application/octet-stream".equals(contentType)) {
                contentType = resolveMimeType(safeFilename);
            }

            long contentLength = properties.getBlobSize();
            String eTag = properties.getETag();
            Instant lastModified = properties.getLastModified() != null
                    ? properties.getLastModified().toInstant()
                    : Instant.now();

            InputStream inputStream = blobClient.openInputStream();
            return Optional.of(new MediaStream(
                    inputStream,
                    contentType,
                    contentLength,
                    eTag,
                    lastModified,
                    safeFilename
            ));
        } catch (Exception e) {
            log.error("[Azure] Error reading blob stream for {}: {}", blobName, e.getMessage());
            return Optional.empty();
        }
    }

    // ─── Delete Product Image ─────────────────────────────────────────────────

    @Override
    public void deleteProductImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;

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

    // ─── Delete Category Image ────────────────────────────────────────────────

    @Override
    public void deleteCategoryImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;

        try {
            String blobName = extractBlobName(imageUrl);
            if (blobName == null) {
                log.warn("[Azure] Cannot derive category blob name from URL: {}", imageUrl);
                return;
            }
            BlobClient blobClient = containerClient.getBlobClient(blobName);
            if (blobClient.exists()) {
                blobClient.delete();
                log.info("[Azure] Deleted category blob: {}", blobName);
            } else {
                log.warn("[Azure] Category blob not found for deletion: {}", blobName);
            }
        } catch (Exception e) {
            log.warn("[Azure] Failed to delete category blob for URL {}: {}", imageUrl, e.getMessage());
        }
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────────

    /**
     * Upload a multipart file to private Azure Blob Storage.
     * Returns the canonical Spring Boot media serving path: {@code /api/media/{blobName}}.
     *
     * @param blobName    relative blob path within container, e.g. "products/prod-1234.webp"
     * @param file        multipart file
     * @param contentType MIME type to set in blob HTTP headers
     * @return canonical media path: /api/media/products/prod-1234.webp
     */
    private String uploadBlob(String blobName, MultipartFile file, String contentType) {
        BlobClient blobClient = containerClient.getBlobClient(blobName);
        BlobHttpHeaders headers = new BlobHttpHeaders().setContentType(contentType);
        try (InputStream is = file.getInputStream()) {
            blobClient.upload(is, file.getSize(), true);
            blobClient.setHttpHeaders(headers);
            log.info("[Azure] Uploaded blob {} ({} bytes) to private storage", blobName, file.getSize());
            return "/api/media/" + blobName;
        } catch (IOException e) {
            log.error("[Azure] Failed to upload blob {}: {}", blobName, e.getMessage(), e);
            throw new BadRequestException("STORAGE_ERROR", "Failed to upload file to storage. Please try again.");
        }
    }

    /**
     * Generate a collision-resistant, sanitized filename for product media.
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
     * Generate a collision-resistant, sanitized filename for category media.
     *
     * @param originalFilename raw client filename (untrusted)
     * @param extension        validated extension (.jpg, .png, etc.)
     * @return safe filename: cat-{timestamp}-{uuid8}{extension}
     */
    private String safeCategoryFileName(String originalFilename, String extension) {
        return "cat-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8) + extension;
    }

    /**
     * Generate a collision-resistant, sanitized filename for storefront content media.
     *
     * @param originalFilename raw client filename (untrusted)
     * @param extension        validated extension (.jpg, .png, etc.)
     * @return safe filename: content-{timestamp}-{uuid8}{extension}
     */
    private String safeContentFileName(String originalFilename, String extension) {
        return "content-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8) + extension;
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
            case "video/webm"      -> ".webm";
            case "video/quicktime" -> ".mov";
            default                -> ".mp4";
        };
    }

    /**
     * Extract the blob name (path within container) from various URL formats:
     * <ul>
     *   <li>/api/media/products/prod-123.jpg → products/prod-123.jpg</li>
     *   <li>https://host/api/media/products/prod-123.jpg → products/prod-123.jpg</li>
     *   <li>https://account.blob.core.windows.net/media/products/prod-123.jpg → products/prod-123.jpg</li>
     *   <li>https://account.blob.core.windows.net/media/products%2Fprod-123.jpg → products/prod-123.jpg</li>
     *   <li>/uploads/products/prod-123.jpg → products/prod-123.jpg</li>
     * </ul>
     */
    private String extractBlobName(String url) {
        if (url == null || url.isBlank()) return null;

        String decoded;
        try {
            decoded = URLDecoder.decode(url, StandardCharsets.UTF_8);
        } catch (Exception e) {
            decoded = url;
        }

        // Canonical /api/media/ path
        int mediaIdx = decoded.indexOf("/api/media/");
        if (mediaIdx != -1) {
            return decoded.substring(mediaIdx + "/api/media/".length());
        }

        // Full Azure blob container URL
        String prefix = blobBaseUrl + "/";
        if (decoded.startsWith(prefix)) {
            return decoded.substring(prefix.length());
        }

        // Legacy /uploads/ path
        int uploadsIdx = decoded.indexOf("/uploads/");
        if (uploadsIdx != -1) {
            return decoded.substring(uploadsIdx + "/uploads/".length());
        }

        // Fallback: check if path contains products/, social/, or categories/
        if (decoded.contains("products/")) {
            return decoded.substring(decoded.indexOf("products/"));
        }
        if (decoded.contains("social/")) {
            return decoded.substring(decoded.indexOf("social/"));
        }
        if (decoded.contains("categories/")) {
            return decoded.substring(decoded.indexOf("categories/"));
        }
        if (decoded.contains("content/")) {
            return decoded.substring(decoded.indexOf("content/"));
        }

        return null;
    }

    private String resolveMimeType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".webm")) return "video/webm";
        if (lower.endsWith(".mov")) return "video/quicktime";
        return "image/jpeg";
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
