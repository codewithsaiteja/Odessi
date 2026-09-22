package com.odessi.api.service;

import com.odessi.api.dto.request.CreateSocialPostRequest;
import com.odessi.api.dto.request.UpdateSocialPostRequest;
import com.odessi.api.dto.response.SocialPostResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SocialPostService {

    List<SocialPostResponse> getPublishedPosts();

    List<SocialPostResponse> getPostsForProduct(Long productId);

    Page<SocialPostResponse> getAllPostsForAdmin(Pageable pageable);

    SocialPostResponse getPostById(Long id);

    SocialPostResponse createPost(CreateSocialPostRequest request, String adminEmail);

    SocialPostResponse updatePost(Long id, UpdateSocialPostRequest request, String adminEmail);

    void deletePost(Long id, String adminEmail);

    SocialPostResponse togglePublished(Long id, boolean published, String adminEmail);

    SocialPostResponse updateDisplayOrder(Long id, int displayOrder, String adminEmail);
}
