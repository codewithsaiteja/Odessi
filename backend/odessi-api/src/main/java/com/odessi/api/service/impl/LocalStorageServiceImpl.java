package com.odessi.api.service.impl;

import com.odessi.api.dto.media.MediaStream;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.service.MediaStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Local filesystem implementation of {@link MediaStorageService}.
 *
 * <p><b>Development only</b>: automatically selected by {@link com.odessi.api.config.MediaStorageConfig}
 * when {@code AZURE_STORAGE_CONNECTION_STRING} is not configured.
 *
 * <p>This class is NOT annotated with {@code @Service} — instantiation is controlled
 * by {@link com.odessi.api.config.MediaStorageConfig} which defines the {@code @Primary} bean.
 *
 * <p><b>NEVER use in production.</b> Files stored on disk are ephemeral on Render/Heroku
 * and will be lost on every deployment or dyno restart.
 */
public class LocalStorageServiceImpl implements MediaStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageServiceImpl.class);

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
        "image/jpeg", "image/png", "image/webp", "image/jpg"
    );

    private final Path uploadDirectory;
    private final Path socialUploadDirectory;
    private final Path categoryUploadDirectory;
    private final Path contentUploadDirectory;

    public LocalStorageServiceImpl() {
        this.uploadDirectory = Paths.get("uploads", "products").toAbsolutePath().normalize();
        this.socialUploadDirectory = Paths.get("uploads", "social").toAbsolutePath().normalize();
        this.categoryUploadDirectory = Paths.get("uploads", "categories").toAbsolutePath().normalize();
        this.contentUploadDirectory = Paths.get("uploads", "content").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDirectory);
            Files.createDirectories(this.socialUploadDirectory);
            Files.createDirectories(this.categoryUploadDirectory);
            Files.createDirectories(this.contentUploadDirectory);
        } catch (IOException e) {
            log.error("Could not create upload directories: {}, {}, {} or {}", this.uploadDirectory, this.socialUploadDirectory, this.categoryUploadDirectory, this.contentUploadDirectory, e);
        }
    }

    @Override
    public String storeProductImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("INVALID_FILE", "Upload file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("FILE_TOO_LARGE", "Image size cannot exceed 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("INVALID_FILE_TYPE", "Only JPG, PNG, and WEBP images are allowed");
        }

        String originalName = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            if (!List.of(".jpg", ".jpeg", ".png", ".webp").contains(extension)) {
                extension = ".jpg";
            }
        }

        String fileName = "prod-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;
        Path targetPath = this.uploadDirectory.resolve(fileName);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored product image to {}", targetPath);
            return "/api/media/products/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store uploaded product image {}", fileName, e);
            throw new BadRequestException("STORAGE_ERROR", "Failed to store image file on server");
        }
    }

    @Override
    public String storeProductVideo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("INVALID_FILE", "Upload file cannot be empty");
        }

        long maxVideoSize = 25 * 1024 * 1024; // 25 MB
        if (file.getSize() > maxVideoSize) {
            throw new BadRequestException("FILE_TOO_LARGE", "Video size cannot exceed 25MB");
        }

        String contentType = file.getContentType();
        List<String> allowedVideoTypes = List.of("video/mp4", "video/webm", "video/quicktime", "video/ogg");
        if (contentType == null || !allowedVideoTypes.contains(contentType.toLowerCase())) {
            throw new BadRequestException("INVALID_FILE_TYPE", "Only MP4, WEBM, and MOV videos are allowed");
        }

        String originalName = file.getOriginalFilename();
        String extension = ".mp4";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            if (!List.of(".mp4", ".webm", ".mov").contains(extension)) {
                extension = ".mp4";
            }
        }

        String fileName = "vid-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;
        Path targetPath = this.uploadDirectory.resolve(fileName);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored product video to {}", targetPath);
            return "/api/media/products/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store uploaded product video {}", fileName, e);
            throw new BadRequestException("STORAGE_ERROR", "Failed to store video file on server");
        }
    }

    @Override
    public String storeSocialImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("INVALID_FILE", "Upload file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("FILE_TOO_LARGE", "Image size cannot exceed 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("INVALID_FILE_TYPE", "Only JPG, PNG, and WEBP images are allowed");
        }

        String originalName = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            if (!List.of(".jpg", ".jpeg", ".png", ".webp").contains(extension)) {
                extension = ".jpg";
            }
        }

        String fileName = "social-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;
        Path targetPath = this.socialUploadDirectory.resolve(fileName);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored social image to {}", targetPath);
            return "/api/media/social/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store uploaded social image {}", fileName, e);
            throw new BadRequestException("STORAGE_ERROR", "Failed to store social image on server");
        }
    }

    @Override
    public Optional<MediaStream> loadMedia(String category, String filename) {
        if (category == null || filename == null) {
            return Optional.empty();
        }

        String safeCategory = category.trim().toLowerCase();
        if (!"products".equals(safeCategory) && !"social".equals(safeCategory) && !"categories".equals(safeCategory)) {
            return Optional.empty();
        }

        String safeFilename = filename.trim();
        if (safeFilename.contains("..") || safeFilename.contains("/") || safeFilename.contains("\\")) {
            log.warn("[LocalStorage] Directory traversal attempt detected: category={}, filename={}", category, filename);
            return Optional.empty();
        }

        Path dir;
        if ("products".equals(safeCategory)) {
            dir = this.uploadDirectory;
        } else if ("categories".equals(safeCategory)) {
            dir = this.categoryUploadDirectory;
        } else if ("content".equals(safeCategory)) {
            dir = this.contentUploadDirectory;
        } else {
            dir = this.socialUploadDirectory;
        }
        Path filePath = dir.resolve(safeFilename).normalize();

        if (!filePath.startsWith(dir) || !Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            return Optional.empty();
        }

        try {
            long size = Files.size(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = resolveMimeType(safeFilename);
            }
            Instant lastModified = Files.getLastModifiedTime(filePath).toInstant();
            String eTag = "\"" + lastModified.toEpochMilli() + "-" + size + "\"";
            InputStream is = Files.newInputStream(filePath);

            return Optional.of(new MediaStream(
                    is,
                    contentType,
                    size,
                    eTag,
                    lastModified,
                    safeFilename
            ));
        } catch (IOException e) {
            log.error("[LocalStorage] Failed reading file {}", filePath, e);
            return Optional.empty();
        }
    }

    @Override
    public void deleteProductImage(String imageUrl) {
        if (imageUrl == null) {
            return;
        }

        String fileName = null;
        if (imageUrl.startsWith("/api/media/products/")) {
            fileName = imageUrl.substring("/api/media/products/".length());
        } else if (imageUrl.startsWith("/uploads/products/")) {
            fileName = imageUrl.substring("/uploads/products/".length());
        }

        if (fileName != null && !fileName.isBlank()) {
            Path filePath = this.uploadDirectory.resolve(fileName).normalize();
            if (filePath.startsWith(this.uploadDirectory)) {
                try {
                    Files.deleteIfExists(filePath);
                    log.info("Deleted product image file {}", filePath);
                } catch (IOException e) {
                    log.warn("Could not delete image file {}", filePath, e);
                }
            }
        }
    }

    @Override
    public String storeCategoryImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("INVALID_FILE", "Upload file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("FILE_TOO_LARGE", "Image size cannot exceed 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("INVALID_FILE_TYPE", "Only JPG, PNG, and WEBP images are allowed");
        }

        String originalName = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            if (!List.of(".jpg", ".jpeg", ".png", ".webp").contains(extension)) {
                extension = ".jpg";
            }
        }

        String fileName = "cat-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;
        Path targetPath = this.categoryUploadDirectory.resolve(fileName);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored category image to {}", targetPath);
            return "/api/media/categories/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store uploaded category image {}", fileName, e);
            throw new BadRequestException("STORAGE_ERROR", "Failed to store category image on server");
        }
    }

    @Override
    public String storeContentImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("INVALID_FILE", "Upload file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("FILE_TOO_LARGE", "Image size cannot exceed 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("INVALID_FILE_TYPE", "Only JPG, PNG, and WEBP images are allowed");
        }

        String originalName = file.getOriginalFilename();
        String extension = ".jpg";
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            if (!List.of(".jpg", ".jpeg", ".png", ".webp").contains(extension)) {
                extension = ".jpg";
            }
        }

        String fileName = "content-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8) + extension;
        Path targetPath = this.contentUploadDirectory.resolve(fileName);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored content image to {}", targetPath);
            return "/api/media/content/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store uploaded content image {}", fileName, e);
            throw new BadRequestException("STORAGE_ERROR", "Failed to store content image on server");
        }
    }

    @Override
    public void deleteCategoryImage(String imageUrl) {
        if (imageUrl == null) {
            return;
        }

        String fileName = null;
        if (imageUrl.startsWith("/api/media/categories/")) {
            fileName = imageUrl.substring("/api/media/categories/".length());
        } else if (imageUrl.startsWith("/uploads/categories/")) {
            fileName = imageUrl.substring("/uploads/categories/".length());
        }

        if (fileName != null && !fileName.isBlank()) {
            Path filePath = this.categoryUploadDirectory.resolve(fileName).normalize();
            if (filePath.startsWith(this.categoryUploadDirectory)) {
                try {
                    Files.deleteIfExists(filePath);
                    log.info("Deleted category image file {}", filePath);
                } catch (IOException e) {
                    log.warn("Could not delete category image file {}", filePath, e);
                }
            }
        }
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
}
