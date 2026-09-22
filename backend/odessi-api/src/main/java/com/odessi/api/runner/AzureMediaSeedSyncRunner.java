package com.odessi.api.runner;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.odessi.api.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

/**
 * On-startup migration utility: uploads missing seed assets from the local
 * {@code uploads/} directory to Azure Blob Storage.
 *
 * <p><b>Purpose</b>: The database seeds (Flyway V15) reference image paths like
 * {@code /uploads/products/genz-prod-1-front.jpeg}. These paths must exist in Azure
 * Blob Storage as {@code products/genz-prod-1-front.jpeg} so the frontend can
 * display them via the correct HTTPS URL.
 *
 * <p><b>Behaviour</b>:
 * <ul>
 *   <li>Only runs when {@code AZURE_STORAGE_CONNECTION_STRING} is configured.</li>
 *   <li>Skips blobs that already exist in Azure (idempotent — safe to re-run).</li>
 *   <li>Does not fail application startup on individual file errors — logs and continues.</li>
 *   <li>Once all seeds are migrated and PostgreSQL image URL references updated to Azure
 *       HTTPS URLs, this runner can be removed.</li>
 * </ul>
 *
 * <p><b>Security</b>: Azure credentials are read from {@link AppProperties} which binds
 * them from the server-side environment variable. They are never logged.
 */
@Component
public class AzureMediaSeedSyncRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AzureMediaSeedSyncRunner.class);

    private final AppProperties appProperties;

    public AzureMediaSeedSyncRunner(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        AppProperties.AzureStorage azureConfig = appProperties.getAzureStorage();

        if (!azureConfig.isConfigured()) {
            log.debug("[SeedSync] Azure not configured — skipping seed asset migration.");
            return;
        }

        log.info("[SeedSync] Starting seed asset migration check to Azure Blob Storage...");

        BlobServiceClient serviceClient;
        try {
            serviceClient = new BlobServiceClientBuilder()
                    .connectionString(azureConfig.getConnectionString())
                    .buildClient();
        } catch (Exception e) {
            log.error("[SeedSync] Failed to create Azure BlobServiceClient: {}", e.getMessage());
            return;
        }

        BlobContainerClient containerClient = serviceClient.getBlobContainerClient(azureConfig.getContainerName());

        AtomicInteger uploaded = new AtomicInteger(0);
        AtomicInteger skipped = new AtomicInteger(0);
        AtomicInteger errors = new AtomicInteger(0);

        syncDirectory(containerClient, "uploads/products", "products", uploaded, skipped, errors);
        syncDirectory(containerClient, "uploads/social", "social", uploaded, skipped, errors);

        log.info("[SeedSync] Complete — uploaded: {}, already existed: {}, errors: {}",
                uploaded.get(), skipped.get(), errors.get());
    }

    private void syncDirectory(
            BlobContainerClient containerClient,
            String localDir,
            String blobPrefix,
            AtomicInteger uploaded,
            AtomicInteger skipped,
            AtomicInteger errors
    ) {
        Path localPath = Paths.get(localDir);
        if (!Files.exists(localPath) || !Files.isDirectory(localPath)) {
            log.debug("[SeedSync] Local directory does not exist, skipping: {}", localPath.toAbsolutePath());
            return;
        }

        try (Stream<Path> files = Files.list(localPath)) {
            files.filter(Files::isRegularFile).forEach(file -> {
                String filename = file.getFileName().toString();
                String blobName = blobPrefix + "/" + filename;
                BlobClient blobClient = containerClient.getBlobClient(blobName);

                try {
                    if (blobClient.exists()) {
                        log.debug("[SeedSync] Already exists in Azure, skipping: {}", blobName);
                        skipped.incrementAndGet();
                        return;
                    }

                    String contentType = probeContentType(file, filename);
                    try (InputStream is = Files.newInputStream(file)) {
                        blobClient.upload(is, Files.size(file), false);
                        blobClient.setHttpHeaders(
                            new com.azure.storage.blob.models.BlobHttpHeaders().setContentType(contentType)
                        );
                    }
                    log.info("[SeedSync] Uploaded {} → {}", filename, blobClient.getBlobUrl());
                    uploaded.incrementAndGet();
                } catch (Exception e) {
                    log.error("[SeedSync] Failed to upload {}: {}", blobName, e.getMessage());
                    errors.incrementAndGet();
                }
            });
        } catch (IOException e) {
            log.error("[SeedSync] Failed to list directory {}: {}", localPath, e.getMessage());
        }
    }

    private String probeContentType(Path file, String filename) {
        try {
            String detected = Files.probeContentType(file);
            if (detected != null) return detected;
        } catch (IOException ignored) {
        }
        // Fallback based on extension
        return URLConnection.getFileNameMap().getContentTypeFor(filename) != null
                ? URLConnection.getFileNameMap().getContentTypeFor(filename)
                : "application/octet-stream";
    }
}
