package com.odessi.api.service.impl;

import com.odessi.api.dto.request.BackInStockSubscribeRequest;
import com.odessi.api.dto.response.BackInStockResponse;
import com.odessi.api.entity.BackInStockRequest;
import com.odessi.api.entity.BackInStockStatus;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductVariant;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.BackInStockRepository;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.repository.ProductVariantRepository;
import com.odessi.api.service.BackInStockService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class BackInStockServiceImpl implements BackInStockService {

    private final BackInStockRepository backInStockRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    public BackInStockServiceImpl(BackInStockRepository backInStockRepository,
                                  ProductRepository productRepository,
                                  ProductVariantRepository variantRepository) {
        this.backInStockRepository = backInStockRepository;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
    }

    @Override
    @Transactional
    public BackInStockResponse subscribe(User user, BackInStockSubscribeRequest request) {
        Product product = productRepository.findById(request.productId())
            .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + request.productId()));

        ProductVariant variant = variantRepository.findById(request.variantId())
            .orElseThrow(() -> new ResourceNotFoundException("VARIANT_NOT_FOUND", "Variant not found: " + request.variantId()));

        if (!variant.getProduct().getId().equals(request.productId())) {
            throw new BadRequestException("INVALID_VARIANT_PRODUCT", "Variant does not belong to specified product");
        }

        // Check if already subscribed and PENDING
        Optional<BackInStockRequest> existing = backInStockRepository.findByVariantIdAndEmailAndStatus(
            variant.getId(), request.email(), BackInStockStatus.PENDING
        );

        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        BackInStockRequest newReq = new BackInStockRequest(user, product, variant, request.email());
        BackInStockRequest saved = backInStockRepository.save(newReq);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BackInStockResponse> getDemandList(Pageable pageable) {
        return backInStockRepository.findByStatus(BackInStockStatus.PENDING, pageable)
            .map(this::toResponse);
    }

    private BackInStockResponse toResponse(BackInStockRequest req) {
        return new BackInStockResponse(
            req.getId(),
            req.getProduct().getId(),
            req.getProduct().getName(),
            req.getVariant().getId(),
            req.getVariant().getSku(),
            req.getEmail(),
            req.getStatus().name(),
            req.getCreatedAt()
        );
    }
}
