package com.odessi.api.mapper;

import com.odessi.api.dto.response.CartItemResponse;
import com.odessi.api.dto.response.CartResponse;
import com.odessi.api.entity.Cart;
import com.odessi.api.entity.CartItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.math.BigDecimal;
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
    CartItemResponse toItemResponse(CartItem item);

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
