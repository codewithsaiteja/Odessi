package com.odessi.api.controller;

import com.odessi.api.config.AppProperties;
import com.odessi.api.config.SecurityConfig;
import com.odessi.api.dto.media.MediaStream;
import com.odessi.api.exception.GlobalExceptionHandler;
import com.odessi.api.security.CustomUserDetailsService;
import com.odessi.api.security.JwtAuthenticationFilter;
import com.odessi.api.security.JwtService;
import com.odessi.api.service.MediaStorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MediaController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class, AppProperties.class,
         JwtService.class, JwtAuthenticationFilter.class})
@DisplayName("MediaController integration tests")
class MediaControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    MediaStorageService mediaStorageService;

    @MockBean
    CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("GET /api/media/products/{filename} — streams image with 200 OK and cache headers")
    void streamMedia_returns200WithStream() throws Exception {
        byte[] content = "fake-image-bytes".getBytes(StandardCharsets.UTF_8);
        MediaStream stream = new MediaStream(
                new ByteArrayInputStream(content),
                "image/jpeg",
                content.length,
                "\"etag-12345\"",
                Instant.now(),
                "prod-123.jpg"
        );

        given(mediaStorageService.loadMedia("products", "prod-123.jpg"))
                .willReturn(Optional.of(stream));

        mockMvc.perform(get("/api/media/products/prod-123.jpg"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.IMAGE_JPEG_VALUE))
                .andExpect(header().string(HttpHeaders.ETAG, "\"etag-12345\""))
                .andExpect(header().exists(HttpHeaders.CACHE_CONTROL))
                .andExpect(content().bytes(content));
    }

    @Test
    @DisplayName("GET /api/media/products/{filename} — with matching If-None-Match returns 304")
    void streamMedia_withMatchingEtag_returns304() throws Exception {
        byte[] content = "fake-image-bytes".getBytes(StandardCharsets.UTF_8);
        MediaStream stream = new MediaStream(
                new ByteArrayInputStream(content),
                "image/jpeg",
                content.length,
                "\"etag-12345\"",
                Instant.now(),
                "prod-123.jpg"
        );

        given(mediaStorageService.loadMedia("products", "prod-123.jpg"))
                .willReturn(Optional.of(stream));

        mockMvc.perform(get("/api/media/products/prod-123.jpg")
                        .header(HttpHeaders.IF_NONE_MATCH, "\"etag-12345\""))
                .andExpect(status().isNotModified())
                .andExpect(header().string(HttpHeaders.ETAG, "\"etag-12345\""));
    }

    @Test
    @DisplayName("GET /api/media/products/{filename} — when file not found returns 404")
    void streamMedia_notFound_returns404() throws Exception {
        given(mediaStorageService.loadMedia("products", "non-existent.jpg"))
                .willReturn(Optional.empty());

        mockMvc.perform(get("/api/media/products/non-existent.jpg"))
                .andExpect(status().isNotFound());
    }
}
