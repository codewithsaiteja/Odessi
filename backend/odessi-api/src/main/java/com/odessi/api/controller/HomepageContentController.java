package com.odessi.api.controller;

import com.odessi.api.dto.response.HomepageContentResponse;
import com.odessi.api.service.HomepageContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/homepage/content")
@Tag(name = "Homepage Content", description = "Public structured storefront content (Hero, Announcement, etc.)")
public class HomepageContentController {

    private final HomepageContentService contentService;

    public HomepageContentController(HomepageContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping
    @Operation(summary = "Get all active homepage content sections")
    public ResponseEntity<List<HomepageContentResponse>> getActiveSections() {
        return ResponseEntity.ok(contentService.getActiveSections());
    }

    @GetMapping("/{sectionKey}")
    @Operation(summary = "Get a specific homepage content section")
    public ResponseEntity<HomepageContentResponse> getSection(@PathVariable String sectionKey) {
        return ResponseEntity.ok(contentService.getSection(sectionKey));
    }
}
