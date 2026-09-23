package com.odessi.api.controller;

import com.odessi.api.dto.media.MediaStream;
import com.odessi.api.service.MediaStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * Public storefront media gateway.
 *
 * <p>Streams media assets (product images, product videos, social images) from
 * private Azure Blob Storage (or local disk in dev) to the storefront and admin clients.
 *
 * <p>Security & Caching Architecture:
 * <ul>
 *   <li>Azure Storage account stays private; no anonymous access is granted on Azure.</li>
 *   <li>Requests are authenticated server-side using the backend Azure SDK client.</li>
 *   <li>Includes HTTP cache headers (immutable, 1 year max-age, ETag, Last-Modified) for
 *       instant edge CDN and browser caching.</li>
 *   <li>Supports conditional {@code If-None-Match} requests returning HTTP 304 Not Modified.</li>
 *   <li>Strict category and path sanitization prevents directory traversal attacks.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/media")
@Tag(name = "Media", description = "Public media streaming access gateway")
public class MediaController {

    private static final Logger log = LoggerFactory.getLogger(MediaController.class);

    private final MediaStorageService mediaStorageService;

    public MediaController(MediaStorageService mediaStorageService) {
        this.mediaStorageService = mediaStorageService;
    }

    @GetMapping("/{category}/{filename:.+}")
    @Operation(summary = "Stream public product or social media asset")
    public ResponseEntity<Resource> streamMedia(
            @PathVariable String category,
            @PathVariable String filename,
            @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch) {

        String safeCategory = decode(category);
        String safeFilename = decode(filename);

        Optional<MediaStream> mediaOpt = mediaStorageService.loadMedia(safeCategory, safeFilename);
        if (mediaOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        MediaStream stream = mediaOpt.get();

        // HTTP 304 Not Modified check
        if (ifNoneMatch != null && stream.eTag() != null) {
            String clientTag = ifNoneMatch.trim();
            if (clientTag.equals(stream.eTag()) || clientTag.equals("W/" + stream.eTag())) {
                try {
                    stream.close();
                } catch (Exception ignored) {
                }
                return ResponseEntity.status(HttpStatus.NOT_MODIFIED)
                        .eTag(stream.eTag())
                        .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                        .build();
            }
        }

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(stream.contentType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        InputStreamResource resource = new InputStreamResource(stream.inputStream()) {
            @Override
            public long contentLength() {
                return stream.contentLength();
            }

            @Override
            public String getFilename() {
                return stream.filename();
            }
        };

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(stream.contentLength())
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .eTag(stream.eTag())
                .lastModified(stream.lastModified())
                .body(resource);
    }

    private String decode(String val) {
        if (val == null) return "";
        try {
            return URLDecoder.decode(val, StandardCharsets.UTF_8).trim();
        } catch (Exception e) {
            return val.trim();
        }
    }
}
