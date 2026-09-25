package com.odessi.api.mapper;

import com.odessi.api.dto.response.CartItemResponse;
import com.odessi.api.dto.response.CartResponse;
import com.odessi.api.entity.Cart;
import com.odessi.api.entity.CartItem;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Mapper(componentModel = "spring")
public interface CartMapper {

    @Mapping(target = "variantId", source = "productVariant.id")
    @Mapping(target = "sku", source = "productVariant.sku")
    @Mapping(target = "productId", source = "productVariant.product.id")
    @Mapping(target = "productName", source = "productVariant.product.name")
    @Mapping(target = "productSlug", source = "productVariant.product.slug")
    @Mapping(target = "size", source = "productVariant.size")
    @Mapping(target = "color", source = "productVariant.color")
    @Mapping(target = "colorHex", source = "productVariant.colorHex")
    @Mapping(target = "unitPrice", source = "productVariant.price")
    @Mapping(target = "lineTotal", expression = "java(item.getProductVariant().getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())))")
    @Mapping(target = "primaryImageUrl", expression = "java(extractItemImageUrl(item))")
    @Mapping(target = "imageUrl", expression = "java(extractItemImageUrl(item))")
    CartItemResponse toItemResponse(CartItem item);

    default String extractItemImageUrl(CartItem item) {
        if (item == null || item.getProductVariant() == null || item.getProductVariant().getProduct() == null) {
            return null;
        }
        Product product = item.getProductVariant().getProduct();
        List<ProductImage> images = product.getImages();
        if (images == null || images.isEmpty()) {
            return null;
        }

        // 1. Prefer product's explicitly designated primary normal IMAGE
        return images.stream()
                .filter(img -> img.getMediaType() == null || "IMAGE".equalsIgnoreCase(img.getMediaType()) || "DEFAULT".equalsIgnoreCase(img.getMediaType()))
                .filter(ProductImage::isPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                // 2. Otherwise use deterministic product media ordering by sortOrder ASC (normal IMAGE)
                .orElseGet(() -> images.stream()
                        .filter(img -> img.getMediaType() == null || "IMAGE".equalsIgnoreCase(img.getMediaType()) || "DEFAULT".equalsIgnoreCase(img.getMediaType()))
                        .min(Comparator.comparingInt(ProductImage::getSortOrder))
                        .map(ProductImage::getImageUrl)
                        // 3. Fallback to any designated primary image
                        .orElseGet(() -> images.stream()
                                .filter(ProductImage::isPrimary)
                                .map(ProductImage::getImageUrl)
                                .findFirst()
                                // 4. Deterministic fallback to lowest sortOrder
                                .orElseGet(() -> images.stream()
                                        .min(Comparator.comparingInt(ProductImage::getSortOrder))
                                        .map(ProductImage::getImageUrl)
                                        .orElse(null))));
    }

    default CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
            .map(this::toItemResponse)
            .toList();

        BigDecimal subtotal = items.stream()
            .map(CartItemResponse::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Shipping estimate: free above ₹999, else ₹99
        BigDecimal shippingEstimate = subtotal.compareTo(new BigDecimal("999")) >= 0
            ? BigDecimal.ZERO
            : new BigDecimal("99");

        BigDecimal total = subtotal.add(shippingEstimate);

        int itemCount = items.stream().mapToInt(CartItemResponse::quantity).sum();

        return new CartResponse(
            cart.getId(),
            cart.getUser().getId(),
            items,
            subtotal,
            shippingEstimate,
            total,
            itemCount,
            cart.getUpdatedAt()
        );
    }
}
