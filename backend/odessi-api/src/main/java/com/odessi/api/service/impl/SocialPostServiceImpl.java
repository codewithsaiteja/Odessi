package com.odessi.api.service.impl;

import com.odessi.api.dto.request.CreateSocialPostRequest;
import com.odessi.api.dto.request.UpdateSocialPostRequest;
import com.odessi.api.dto.response.SocialPostResponse;
import com.odessi.api.entity.Collection;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import com.odessi.api.entity.SocialPost;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.CollectionRepository;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.repository.SocialPostRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.AdminAuditService;
import com.odessi.api.service.SocialPostService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SocialPostServiceImpl implements SocialPostService {

    private final SocialPostRepository socialPostRepository;
    private final ProductRepository productRepository;
    private final CollectionRepository collectionRepository;
    private final UserRepository userRepository;
    private final AdminAuditService auditService;

    public SocialPostServiceImpl(
            SocialPostRepository socialPostRepository,
            ProductRepository productRepository,
            CollectionRepository collectionRepository,
            UserRepository userRepository,
            AdminAuditService auditService) {
        this.socialPostRepository = socialPostRepository;
        this.productRepository = productRepository;
        this.collectionRepository = collectionRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    private SocialPostResponse toResponse(SocialPost s) {
        Product p = s.getProduct();
        Collection c = s.getCollection();

        String primaryImg = null;
        if (p != null && p.getImages() != null && !p.getImages().isEmpty()) {
            primaryImg = p.getImages().stream()
                    .filter(ProductImage::isPrimary)
                    .map(ProductImage::getImageUrl)
                    .findFirst()
                    .orElse(p.getImages().get(0).getImageUrl());
        }

        return new SocialPostResponse(
                s.getId(),
                s.getMediaUrl(),
                s.getInstagramUrl(),
                s.getCaption(),
                s.getTitle(),
                p != null ? p.getId() : null,
                p != null ? p.getName() : null,
                p != null ? p.getSlug() : null,
                p != null ? p.getPrice() : null,
                p != null ? p.getCompareAtPrice() : null,
                p != null ? p.getCurrency() : null,
                primaryImg,
                c != null ? c.getId() : null,
                c != null ? c.getName() : null,
                c != null ? c.getSlug() : null,
                s.isPublished(),
                s.getDisplayOrder(),
                s.getCreatedAt(),
                s.getUpdatedAt()
        );
    }

    @Override
    public List<SocialPostResponse> getPublishedPosts() {
        return socialPostRepository.findPublishedPostsWithRelations().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<SocialPostResponse> getPostsForProduct(Long productId) {
        return socialPostRepository.findByProductIdAndPublishedTrue(productId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Page<SocialPostResponse> getAllPostsForAdmin(Pageable pageable) {
        return socialPostRepository.findAllForAdmin(pageable)
                .map(this::toResponse);
    }

    @Override
    public SocialPostResponse getPostById(Long id) {
        SocialPost post = socialPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SOCIAL_POST_NOT_FOUND", "Social post not found: " + id));
        return toResponse(post);
    }

    @Override
    @Transactional
    public SocialPostResponse createPost(CreateSocialPostRequest request, String adminEmail) {
        SocialPost post = new SocialPost();
        post.setMediaUrl(request.mediaUrl().trim());
        post.setInstagramUrl(request.instagramUrl() != null ? request.instagramUrl().trim() : null);
        post.setCaption(request.caption());
        post.setTitle(request.title());
        post.setPublished(request.published() != null ? request.published() : true);
        post.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);

        if (request.productId() != null) {
            Product product = productRepository.findById(request.productId())
                    .orElseThrow(() -> new BadRequestException("INVALID_PRODUCT", "Product not found with ID: " + request.productId()));
            post.setProduct(product);
        }

        if (request.collectionId() != null) {
            Collection collection = collectionRepository.findById(request.collectionId())
                    .orElseThrow(() -> new BadRequestException("INVALID_COLLECTION", "Collection not found with ID: " + request.collectionId()));
            post.setCollection(collection);
        }

        SocialPost saved = socialPostRepository.save(post);

        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(
                admin,
                "SOCIAL_POST_CREATED",
                "SocialPost",
                saved.getId().toString(),
                "Created social post with media " + saved.getMediaUrl() + (saved.getProduct() != null ? " linked to product " + saved.getProduct().getId() : "")
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public SocialPostResponse updatePost(Long id, UpdateSocialPostRequest request, String adminEmail) {
        SocialPost post = socialPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SOCIAL_POST_NOT_FOUND", "Social post not found: " + id));

        post.setMediaUrl(request.mediaUrl().trim());
        post.setInstagramUrl(request.instagramUrl() != null ? request.instagramUrl().trim() : null);
        post.setCaption(request.caption());
        post.setTitle(request.title());
        if (request.published() != null) {
            post.setPublished(request.published());
        }
        if (request.displayOrder() != null) {
            post.setDisplayOrder(request.displayOrder());
        }

        if (request.productId() != null) {
            Product product = productRepository.findById(request.productId())
                    .orElseThrow(() -> new BadRequestException("INVALID_PRODUCT", "Product not found with ID: " + request.productId()));
            post.setProduct(product);
        } else {
            post.setProduct(null);
        }

        if (request.collectionId() != null) {
            Collection collection = collectionRepository.findById(request.collectionId())
                    .orElseThrow(() -> new BadRequestException("INVALID_COLLECTION", "Collection not found with ID: " + request.collectionId()));
            post.setCollection(collection);
        } else {
            post.setCollection(null);
        }

        SocialPost updated = socialPostRepository.save(post);

        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(
                admin,
                "SOCIAL_POST_UPDATED",
                "SocialPost",
                id.toString(),
                "Updated social post ID: " + id
        );

        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deletePost(Long id, String adminEmail) {
        SocialPost post = socialPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SOCIAL_POST_NOT_FOUND", "Social post not found: " + id));

        socialPostRepository.delete(post);

        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(
                admin,
                "SOCIAL_POST_DELETED",
                "SocialPost",
                id.toString(),
                "Deleted social post ID: " + id
        );
    }

    @Override
    @Transactional
    public SocialPostResponse togglePublished(Long id, boolean published, String adminEmail) {
        SocialPost post = socialPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SOCIAL_POST_NOT_FOUND", "Social post not found: " + id));

        post.setPublished(published);
        SocialPost updated = socialPostRepository.save(post);

        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(
                admin,
                "SOCIAL_POST_STATUS_CHANGED",
                "SocialPost",
                id.toString(),
                "Set social post published=" + published
        );

        return toResponse(updated);
    }

    @Override
    @Transactional
    public SocialPostResponse updateDisplayOrder(Long id, int displayOrder, String adminEmail) {
        SocialPost post = socialPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SOCIAL_POST_NOT_FOUND", "Social post not found: " + id));

        post.setDisplayOrder(displayOrder);
        SocialPost updated = socialPostRepository.save(post);

        return toResponse(updated);
    }
}
