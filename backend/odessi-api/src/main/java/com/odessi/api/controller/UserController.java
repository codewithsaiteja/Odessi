package com.odessi.api.controller;

import com.odessi.api.dto.request.ChangePasswordRequest;
import com.odessi.api.dto.request.UpdateProfileRequest;
import com.odessi.api.dto.response.UserResponse;
import com.odessi.api.entity.User;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.dto.response.ProductReviewResponse;
import com.odessi.api.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final ReviewService reviewService;

    public UserController(AuthService authService, UserRepository userRepository, ReviewService reviewService) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.reviewService = reviewService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(authService.mapToUserResponse(user));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        User user = authService.getCurrentUser();
        
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        
        userRepository.save(user);
        
        return ResponseEntity.ok(authService.mapToUserResponse(user));
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        User user = authService.getCurrentUser();
        authService.changePassword(user, request);
        
        // Invalidate refresh tokens here if needed
        authService.revokeAllUserRefreshTokens(user);
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me/reviews")
    public ResponseEntity<PagedResponse<ProductReviewResponse>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = authService.getCurrentUser();
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ProductReviewResponse> reviewPage = reviewService.getUserReviews(user.getId(), pageable);
        return ResponseEntity.ok(PagedResponse.of(reviewPage.getContent(), reviewPage.getNumber(), reviewPage.getSize(), reviewPage.getTotalElements()));
    }
}
