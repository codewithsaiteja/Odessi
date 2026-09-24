package com.odessi.api.runner;

import com.odessi.api.repository.ProductImageRepository;
import com.odessi.api.repository.SocialPostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeedSyncDbService {

    private final ProductImageRepository productImageRepository;
    private final SocialPostRepository socialPostRepository;

    public SeedSyncDbService(ProductImageRepository productImageRepository, SocialPostRepository socialPostRepository) {
        this.productImageRepository = productImageRepository;
        this.socialPostRepository = socialPostRepository;
    }

    @Transactional
    public int updateProductImageUrl(String oldUrl, String newUrl) {
        return productImageRepository.updateImageUrl(oldUrl, newUrl);
    }

    @Transactional
    public int updateSocialMediaUrl(String oldUrl, String newUrl) {
        return socialPostRepository.updateMediaUrl(oldUrl, newUrl);
    }
}
