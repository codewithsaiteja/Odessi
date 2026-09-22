package com.odessi.api.mapper;

import com.odessi.api.dto.response.CartItemResponse;
import com.odessi.api.entity.CartItem;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductVariant;
import java.math.BigDecimal;
import java.time.Instant;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-22T00:05:31+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class CartMapperImpl implements CartMapper {

    @Override
    public CartItemResponse toItemResponse(CartItem item) {
        if ( item == null ) {
            return null;
        }

        Long variantId = null;
        String sku = null;
        Long productId = null;
        String productName = null;
        String productSlug = null;
        String size = null;
        String color = null;
        String colorHex = null;
        BigDecimal unitPrice = null;
        Long id = null;
        int quantity = 0;
        Instant createdAt = null;

        variantId = itemProductVariantId( item );
        sku = itemProductVariantSku( item );
        productId = itemProductVariantProductId( item );
        productName = itemProductVariantProductName( item );
        productSlug = itemProductVariantProductSlug( item );
        size = itemProductVariantSize( item );
        color = itemProductVariantColor( item );
        colorHex = itemProductVariantColorHex( item );
        unitPrice = itemProductVariantPrice( item );
        id = item.getId();
        quantity = item.getQuantity();
        createdAt = item.getCreatedAt();

        BigDecimal lineTotal = item.getProductVariant().getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity()));

        CartItemResponse cartItemResponse = new CartItemResponse( id, variantId, sku, productId, productName, productSlug, size, color, colorHex, unitPrice, quantity, lineTotal, createdAt );

        return cartItemResponse;
    }

    private Long itemProductVariantId(CartItem cartItem) {
        if ( cartItem == null ) {
            return null;
        }
        ProductVariant productVariant = cartItem.getProductVariant();
        if ( productVariant == null ) {
            return null;
        }
        Long id = productVariant.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String itemProductVariantSku(CartItem cartItem) {
        if ( cartItem == null ) {
            return null;
        }
        ProductVariant productVariant = cartItem.getProductVariant();
        if ( productVariant == null ) {
            return null;
        }
        String sku = productVariant.getSku();
        if ( sku == null ) {
            return null;
        }
        return sku;
    }

    private Long itemProductVariantProductId(CartItem cartItem) {
        if ( cartItem == null ) {
            return null;
        }
        ProductVariant productVariant = cartItem.getProductVariant();
        if ( productVariant == null ) {
            return null;
        }
        Product product = productVariant.getProduct();
        if ( product == null ) {
            return null;
        }
        Long id = product.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String itemProductVariantProductName(CartItem cartItem) {
        if ( cartItem == null ) {
            return null;
        }
        ProductVariant productVariant = cartItem.getProductVariant();
        if ( productVariant == null ) {
            return null;
        }
        Product product = productVariant.getProduct();
        if ( product == null ) {
            return null;
        }
        String name = product.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    private String itemProductVariantProductSlug(CartItem cartItem) {
        if ( cartItem == null ) {
            return null;
        }
        ProductVariant productVariant = cartItem.getProductVariant();
        if ( productVariant == null ) {
            return null;
        }
        Product product = productVariant.getProduct();
        if ( product == null ) {
            return null;
        }
        String slug = product.getSlug();
        if ( slug == null ) {
            return null;
        }
        return slug;
    }

    private String itemProductVariantSize(CartItem cartItem) {
        if ( cartItem == null ) {
            return null;
        }
        ProductVariant productVariant = cartItem.getProductVariant();
        if ( productVariant == null ) {
            return null;
        }
        String size = productVariant.getSize();
        if ( size == null ) {
            return null;
        }
        return size;
    }

    private String itemProductVariantColor(CartItem cartItem) {
        if ( cartItem == null ) {
            return null;
        }
        ProductVariant productVariant = cartItem.getProductVariant();
        if ( productVariant == null ) {
            return null;
        }
        String color = productVariant.getColor();
        if ( color == null ) {
            return null;
        }
        return color;
    }

    private String itemProductVariantColorHex(CartItem cartItem) {
        if ( cartItem == null ) {
            return null;
        }
        ProductVariant productVariant = cartItem.getProductVariant();
        if ( productVariant == null ) {
            return null;
        }
        String colorHex = productVariant.getColorHex();
        if ( colorHex == null ) {
            return null;
        }
        return colorHex;
    }

    private BigDecimal itemProductVariantPrice(CartItem cartItem) {
        if ( cartItem == null ) {
            return null;
        }
        ProductVariant productVariant = cartItem.getProductVariant();
        if ( productVariant == null ) {
            return null;
        }
        BigDecimal price = productVariant.getPrice();
        if ( price == null ) {
            return null;
        }
        return price;
    }
}
