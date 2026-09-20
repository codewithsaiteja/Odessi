package com.odessi.api.service.impl;

import com.odessi.api.dto.request.CreateProductRequest;
import com.odessi.api.dto.request.CreateProductVariantRequest;
import com.odessi.api.dto.request.ProductFilterRequest;
import com.odessi.api.dto.request.UpdateProductRequest;
import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.dto.response.ProductSummaryResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductVariant;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.ProductMapper;
import com.odessi.api.repository.CategoryRepository;
import com.odessi.api.repository.CollectionRepository;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.repository.ProductSpecification;
import com.odessi.api.repository.ProductVariantRepository;
import com.odessi.api.service.ProductService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductServiceImpl.class);

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CategoryRepository categoryRepository;
    private final CollectionRepository collectionRepository;
    private final ProductMapper productMapper;

    public ProductServiceImpl(
            ProductRepository productRepository,
            ProductVariantRepository variantRepository,
            CategoryRepository categoryRepository,
            CollectionRepository collectionRepository,
            ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.categoryRepository = categoryRepository;
        this.collectionRepository = collectionRepository;
        this.productMapper = productMapper;
    }

    @Override
    public PagedResponse<ProductSummaryResponse> findAll(ProductFilterRequest rawFilter) {
        ProductFilterRequest filter = rawFilter.withDefaults();

        Pageable pageable = PageRequest.of(
            filter.page(),
            Math.min(filter.pageSize(), 100),       // cap at 100 per page
            buildSort(filter.sort())
        );

        Page<Product> page = productRepository.findAll(new ProductSpecification(filter), pageable);

        log.info("Product fetch: filter={}, pageable={}, totalElements={}", filter, pageable, page.getTotalElements());

        return PagedResponse.of(
            page.getContent().stream().map(productMapper::toSummaryResponse).toList(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements()
        );
    }

    @Override
    public ProductResponse findBySlug(String slug) {
        Product product = productRepository.findBySlugWithVariants(slug)
            .orElseThrow(() -> ResourceNotFoundException.product(slug));
        return productMapper.toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse create(CreateProductRequest request) {
        if (productRepository.existsBySlug(request.slug())) {
            throw BusinessException.duplicateSlug(request.slug());
        }

        Product product = new Product();
        product.setName(request.name());
        product.setSlug(request.slug());
        product.setDescription(request.description());
        product.setShortDescription(request.shortDescription());
        product.setPrice(request.price());
        product.setCompareAtPrice(request.compareAtPrice());
        product.setMaterial(request.material());
        product.setFit(request.fit());
        product.setCareInstructions(request.careInstructions());
        product.setFeatured(request.featured());
        product.setBestseller(request.bestseller());
        product.setNewArrival(request.newArrival());

        if (request.categoryId() != null) {
            product.setCategory(categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> ResourceNotFoundException.category("id:" + request.categoryId())));
        }

        if (request.collectionId() != null) {
            product.setCollection(collectionRepository.findById(request.collectionId())
                .orElseThrow(() -> ResourceNotFoundException.collection("id:" + request.collectionId())));
        }

        if (request.variants() != null) {
            for (CreateProductVariantRequest vr : request.variants()) {
                if (variantRepository.existsBySku(vr.sku())) {
                    throw BusinessException.duplicateSku(vr.sku());
                }
                ProductVariant variant = buildVariant(vr);
                product.addVariant(variant);
            }
        }

        Product saved = productRepository.save(product);
        log.info("Created product: id={}, slug={}", saved.getId(), saved.getSlug());
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse update(Long id, UpdateProductRequest request) {
        Product product = productRepository.findByIdWithVariants(id)
            .orElseThrow(() -> ResourceNotFoundException.productById(id));

        if (request.name() != null) product.setName(request.name());
        if (request.description() != null) product.setDescription(request.description());
        if (request.shortDescription() != null) product.setShortDescription(request.shortDescription());
        if (request.price() != null) product.setPrice(request.price());
        if (request.compareAtPrice() != null) product.setCompareAtPrice(request.compareAtPrice());
        if (request.material() != null) product.setMaterial(request.material());
        if (request.fit() != null) product.setFit(request.fit());
        if (request.careInstructions() != null) product.setCareInstructions(request.careInstructions());
        if (request.featured() != null) product.setFeatured(request.featured());
        if (request.bestseller() != null) product.setBestseller(request.bestseller());
        if (request.newArrival() != null) product.setNewArrival(request.newArrival());
        if (request.active() != null) product.setActive(request.active());

        if (request.categoryId() != null) {
            product.setCategory(categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> ResourceNotFoundException.category("id:" + request.categoryId())));
        }

        if (request.collectionId() != null) {
            product.setCollection(collectionRepository.findById(request.collectionId())
                .orElseThrow(() -> ResourceNotFoundException.collection("id:" + request.collectionId())));
        }

        Product saved = productRepository.save(product);
        log.info("Updated product: id={}", saved.getId());
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> ResourceNotFoundException.productById(id));
        product.setActive(false);   // soft delete
        productRepository.save(product);
        log.info("Soft-deleted product: id={}", id);
    }

    // ── Private helpers ───────────────────────────────────────────

    private ProductVariant buildVariant(CreateProductVariantRequest r) {
        ProductVariant v = new ProductVariant();
        v.setSku(r.sku());
        v.setSize(r.size());
        v.setColor(r.color());
        v.setColorHex(r.colorHex());
        v.setPrice(r.price());
        v.setStockQuantity(r.stockQuantity());
        return v;
    }

    private Sort buildSort(String sort) {
        return switch (sort != null ? sort : "newest") {
            case "price_low"   -> Sort.by(Sort.Direction.ASC, "price");
            case "price_high"  -> Sort.by(Sort.Direction.DESC, "price");
            case "bestselling" -> Sort.by(Sort.Direction.DESC, "bestseller").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "featured"    -> Sort.by(Sort.Direction.DESC, "featured").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            default            -> Sort.by(Sort.Direction.DESC, "createdAt");  // "newest"
        };
    }
}
