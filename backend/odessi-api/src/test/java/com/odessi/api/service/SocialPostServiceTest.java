package com.odessi.api.service;

import com.odessi.api.dto.request.CreateSocialPostRequest;
import com.odessi.api.dto.request.UpdateSocialPostRequest;
import com.odessi.api.dto.response.SocialPostResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.SocialPost;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.CollectionRepository;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.repository.SocialPostRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.impl.SocialPostServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialPostServiceTest {

    @Mock private SocialPostRepository socialPostRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CollectionRepository collectionRepository;
    @Mock private UserRepository userRepository;
    @Mock private AdminAuditService auditService;

    private SocialPostServiceImpl socialPostService;
    private Product testProduct;
    private SocialPost testPost;

    @BeforeEach
    void setUp() {
        socialPostService = new SocialPostServiceImpl(
                socialPostRepository,
                productRepository,
                collectionRepository,
                userRepository,
                auditService
        );

        testProduct = new Product();
        testProduct.setId(10L);
        testProduct.setName("Bahubali Hoodie");
        testProduct.setSlug("bahubali-hoodie");
        testProduct.setPrice(new BigDecimal("1499.00"));

        testPost = new SocialPost();
        testPost.setId(1L);
        testPost.setMediaUrl("/uploads/social/post1.jpg");
        testPost.setInstagramUrl("https://instagram.com/p/123");
        testPost.setCaption("Wear the story");
        testPost.setTitle("Hoodie Drop");
        testPost.setProduct(testProduct);
        testPost.setPublished(true);
        testPost.setDisplayOrder(1);
    }

    @Test
    @DisplayName("getPublishedPosts returns published social posts")
    void getPublishedPosts_Success() {
        when(socialPostRepository.findPublishedPostsWithRelations()).thenReturn(List.of(testPost));

        List<SocialPostResponse> posts = socialPostService.getPublishedPosts();

        assertThat(posts).hasSize(1);
        assertThat(posts.get(0).productName()).isEqualTo("Bahubali Hoodie");
        assertThat(posts.get(0).productPrice()).isEqualByComparingTo("1499.00");
    }

    @Test
    @DisplayName("createPost succeeds and links product")
    void createPost_Success() {
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(socialPostRepository.save(any(SocialPost.class))).thenAnswer(invocation -> {
            SocialPost p = invocation.getArgument(0);
            p.setId(2L);
            return p;
        });

        CreateSocialPostRequest req = new CreateSocialPostRequest(
                "/uploads/social/post2.jpg",
                "https://instagram.com/p/456",
                "New post",
                "Drop 2",
                10L,
                null,
                true,
                2
        );

        SocialPostResponse res = socialPostService.createPost(req, "admin@odessi.com");

        assertThat(res).isNotNull();
        assertThat(res.id()).isEqualTo(2L);
        assertThat(res.productSlug()).isEqualTo("bahubali-hoodie");
    }

    @Test
    @DisplayName("createPost fails when product ID is invalid")
    void createPost_InvalidProductFails() {
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        CreateSocialPostRequest req = new CreateSocialPostRequest(
                "/uploads/social/post.jpg",
                null,
                "Caption",
                "Title",
                999L,
                null,
                true,
                1
        );

        assertThatThrownBy(() -> socialPostService.createPost(req, "admin@odessi.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    @DisplayName("deletePost deletes post and logs audit")
    void deletePost_Success() {
        when(socialPostRepository.findById(1L)).thenReturn(Optional.of(testPost));

        socialPostService.deletePost(1L, "admin@odessi.com");

        verify(socialPostRepository).delete(testPost);
        verify(auditService).logAction(any(), eq("SOCIAL_POST_DELETED"), eq("SocialPost"), eq("1"), any());
    }

    @Test
    @DisplayName("togglePublished updates status")
    void togglePublished_Success() {
        when(socialPostRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(socialPostRepository.save(any(SocialPost.class))).thenReturn(testPost);

        SocialPostResponse res = socialPostService.togglePublished(1L, false, "admin@odessi.com");

        assertThat(res.published()).isFalse();
        verify(auditService).logAction(any(), eq("SOCIAL_POST_STATUS_CHANGED"), eq("SocialPost"), eq("1"), any());
    }
}
