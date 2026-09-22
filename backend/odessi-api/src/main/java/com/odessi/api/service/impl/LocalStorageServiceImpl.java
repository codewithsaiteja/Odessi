package com.odessi.api.service.impl;

import com.odessi.api.exception.BadRequestException;
import com.odessi.api.service.MediaStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class LocalStorageServiceImpl implements MediaStorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageServiceImpl.class);

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
        "image/jpeg", "image/png", "image/webp", "image/jpg"
    );

    private final Path uploadDirectory;
    private final Path socialUploadDirectory;

    public LocalStorageServiceImpl() {
        this.uploadDirectory = Paths.get("uploads", "products").toAbsolutePath().normalize();
        this.socialUploadDirectory = Paths.get("uploads", "social").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDirectory);
            Files.createDirectories(this.socialUploadDirectory);
        } catch (IOException e) {
            log.error("Could not create upload directories: {} or {}", this.uploadDirectory, this.socialUploadDirectory, e);
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
            return "/uploads/products/" + fileName;
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
            return "/uploads/products/" + fileName;
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
            return "/uploads/social/" + fileName;
        } catch (IOException e) {
            log.error("Failed to store uploaded social image {}", fileName, e);
            throw new BadRequestException("STORAGE_ERROR", "Failed to store social image on server");
        }
    }

    @Override
    public void deleteProductImage(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith("/uploads/products/")) {
            return;
        }

        String fileName = imageUrl.substring("/uploads/products/".length());
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
