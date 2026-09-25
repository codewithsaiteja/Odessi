package com.odessi.api.service.impl;

import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.User;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.ProductMapper;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.service.AdminAuditService;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.DropService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class DropServiceImpl implements DropService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final AdminAuditService auditService;
    private final AuthService authService;

    public DropServiceImpl(
            ProductRepository productRepository,
            ProductMapper productMapper,
            AdminAuditService auditService,
            AuthService authService) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.auditService = auditService;
        this.authService = authService;
    }

    @Override
    public PagedResponse<ProductResponse> getAdminDrops(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Product> productPage = productRepository.findAll(pageRequest);

        // Mapping inside the @Transactional(readOnly = true) boundary ensures lazy associations map without LazyInitializationException
        List<ProductResponse> content = productPage.getContent().stream()
                .map(productMapper::toResponse)
                .toList();

        return PagedResponse.of(
                content,
                productPage.getNumber(),
                productPage.getSize(),
                productPage.getTotalElements()
        );
    }

    @Override
    @Transactional
    public ProductResponse configureDrop(Long id, Map<String, Object> body) {
        User admin = authService.getCurrentUser();
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PRODUCT_NOT_FOUND", "Product not found: " + id));

        Boolean isDrop = (Boolean) body.get("isDrop");
        String dropTitle = (String) body.get("dropTitle");
        String dropDescription = (String) body.get("dropDescription");
        String launchAtStr = (String) body.get("launchAt");

        if (isDrop != null) product.setDrop(isDrop);
        if (dropTitle != null) product.setDropTitle(dropTitle);
        if (dropDescription != null) product.setDropDescription(dropDescription);
        if (launchAtStr != null && !launchAtStr.isBlank()) {
            product.setLaunchAt(Instant.parse(launchAtStr));
        } else if (Boolean.FALSE.equals(isDrop)) {
            product.setLaunchAt(null);
        }

        Product updated = productRepository.save(product);

        auditService.logAction(admin, "DROP_CONFIGURED", "Product", id.toString(),
                "Configured drop settings for product " + updated.getName() + " (isDrop=" + updated.isDrop() + ")");

        return productMapper.toResponse(updated);
    }
}
