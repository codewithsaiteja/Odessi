package com.odessi.api.service;

import com.odessi.api.dto.request.UpdateHomepageContentRequest;
import com.odessi.api.dto.response.HomepageContentResponse;

import java.util.List;

public interface HomepageContentService {
    List<HomepageContentResponse> getActiveSections();
    List<HomepageContentResponse> getAllSectionsForAdmin();
    HomepageContentResponse getSection(String sectionKey);
    HomepageContentResponse updateSection(String sectionKey, UpdateHomepageContentRequest request, String adminEmail);
    String uploadContentMedia(org.springframework.web.multipart.MultipartFile file);
}
