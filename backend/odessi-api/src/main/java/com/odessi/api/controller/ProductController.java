package com.odessi.api.controller;

import com.odessi.api.dto.request.ProductFilterRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.dto.response.ProductSummaryResponse;
import com.odessi.api.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
@Tag(name = "Products", description = "Product catalog endpoints")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /**
     * GET /api/products
     * Supports: category, collection, size, color, minPrice, maxPrice,
     *           available, featured, bestseller, newArrival, search,
     *           sort, page, size
     */
    @GetMapping
    @Operation(summary = "List products", description = "Returns paginated, filterable product list")
    public ResponseEntity<PagedResponse<ProductSummaryResponse>> listProducts(
            @Parameter(description = "Category slug") @RequestParam(required = false) String category,
            @Parameter(description = "Collection slug") @RequestParam(required = false) String collection,
            @Parameter(description = "Clothing size filter e.g. S/M/L/XL") @RequestParam(required = false) String size,
            @Parameter(description = "Color filter") @RequestParam(required = false) String color,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Only available products") @RequestParam(required = false) Boolean available,
            @Parameter(description = "Featured products only") @RequestParam(required = false) Boolean featured,
            @Parameter(description = "Bestsellers only") @RequestParam(required = false) Boolean bestseller,
            @Parameter(description = "New arrivals only") @RequestParam(required = false) Boolean newArrival,
            @Parameter(description = "Search query") @RequestParam(required = false) String search,
            @Parameter(description = "Sort: newest|featured|price_low|price_high|bestselling") @RequestParam(required = false, defaultValue = "newest") String sort,
            @Parameter(description = "Page number (0-indexed)") @RequestParam(required = false, defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(required = false, defaultValue = "20") int pageSize
    ) {
        String actualClothingSize = size;
        int actualPageSize = pageSize;

        if (size != null && size.matches("\\d+")) {
            actualPageSize = Integer.parseInt(size);
            actualClothingSize = null;
        }

        var filter = new ProductFilterRequest(
            category, collection, actualClothingSize, color,
            minPrice, maxPrice,
            available, featured, bestseller, newArrival,
            search, sort, page, actualPageSize
        );
        return ResponseEntity.ok(productService.findAll(filter));
    }

    /**
     * GET /api/products/{slug} or /api/products/slug/{slug}
     */
    @GetMapping(value = {"/{slug}", "/slug/{slug}"})
    @Operation(summary = "Get product by slug", description = "Returns full product details including all variants")
    public ResponseEntity<ApiResponse<ProductResponse>> getProduct(
            @PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.ok(productService.findBySlug(slug)));
    }
}
