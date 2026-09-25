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

        // 1. Variant-matching normal image by color if altText matches variant color
        String variantColor = item.getProductVariant().getColor();
        if (variantColor != null && !variantColor.isBlank()) {
            String colorLower = variantColor.trim().toLowerCase();
            var colorMatch = images.stream()
                .filter(img -> isNormalImage(img.getMediaType()))
                .filter(img -> img.getAltText() != null && img.getAltText().toLowerCase().contains(colorLower))
                .findFirst();
            if (colorMatch.isPresent()) {
                return colorMatch.get().getImageUrl();
            }
        }

        // 2. Prefer product's explicitly designated primary normal IMAGE
        return images.stream()
                .filter(img -> isNormalImage(img.getMediaType()))
                .filter(ProductImage::isPrimary)
                .map(ProductImage::getImageUrl)
                .findFirst()
                // 3. Otherwise use deterministic product media ordering by sortOrder ASC (normal IMAGE)
                .orElseGet(() -> images.stream()
                        .filter(img -> isNormalImage(img.getMediaType()))
                        .min(Comparator.comparingInt(ProductImage::getSortOrder))
                        .map(ProductImage::getImageUrl)
                        // 4. Fallback to any designated primary image (excluding non-normal media)
                        .orElseGet(() -> images.stream()
                                .filter(img -> isNotSpecialMedia(img.getMediaType()))
                                .filter(ProductImage::isPrimary)
                                .map(ProductImage::getImageUrl)
                                .findFirst()
                                // 5. Deterministic fallback to lowest sortOrder excluding non-normal media
                                .orElseGet(() -> images.stream()
                                        .filter(img -> isNotSpecialMedia(img.getMediaType()))
                                        .min(Comparator.comparingInt(ProductImage::getSortOrder))
                                        .map(ProductImage::getImageUrl)
                                        .orElse(null))));
    }

    private static boolean isNormalImage(String mediaType) {
        return mediaType == null 
            || "IMAGE".equalsIgnoreCase(mediaType) 
            || "DEFAULT".equalsIgnoreCase(mediaType);
    }

    private static boolean isNotSpecialMedia(String mediaType) {
        if (mediaType == null) return true;
        String mt = mediaType.toUpperCase();
        return !mt.contains("SPIN") 
            && !mt.contains("360") 
            && !mt.contains("TRAIL") 
            && !mt.contains("DECART") 
            && !mt.contains("VIDEO");
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
