package com.odessi.api.mapper;

import com.odessi.api.dto.response.OrderItemResponse;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderItem;
import com.odessi.api.entity.OrderStatus;
import com.odessi.api.entity.PaymentStatus;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductVariant;
import com.odessi.api.entity.User;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-22T00:05:32+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class OrderMapperImpl implements OrderMapper {

    @Override
    public OrderItemResponse toItemResponse(OrderItem item) {
        if ( item == null ) {
            return null;
        }

        Long variantId = null;
        Long productId = null;
        String productSlug = null;
        Long id = null;
        String productNameSnapshot = null;
        String skuSnapshot = null;
        String sizeSnapshot = null;
        String colorSnapshot = null;
        BigDecimal unitPrice = null;
        int quantity = 0;
        BigDecimal totalPrice = null;

        variantId = itemProductVariantId( item );
        productId = itemProductVariantProductId( item );
        productSlug = itemProductVariantProductSlug( item );
        id = item.getId();
        productNameSnapshot = item.getProductNameSnapshot();
        skuSnapshot = item.getSkuSnapshot();
        sizeSnapshot = item.getSizeSnapshot();
        colorSnapshot = item.getColorSnapshot();
        unitPrice = item.getUnitPrice();
        quantity = item.getQuantity();
        totalPrice = item.getTotalPrice();

        OrderItemResponse orderItemResponse = new OrderItemResponse( id, variantId, productId, productSlug, productNameSnapshot, skuSnapshot, sizeSnapshot, colorSnapshot, unitPrice, quantity, totalPrice );

        return orderItemResponse;
    }

    @Override
    public OrderResponse toResponse(Order order) {
        if ( order == null ) {
            return null;
        }

        Long userId = null;
        Long id = null;
        String orderNumber = null;
        List<OrderItemResponse> items = null;
        BigDecimal subtotal = null;
        BigDecimal shippingAmount = null;
        BigDecimal discountAmount = null;
        BigDecimal taxAmount = null;
        BigDecimal totalAmount = null;
        String currency = null;
        OrderStatus status = null;
        PaymentStatus paymentStatus = null;
        String shippingAddressSnapshot = null;
        Instant createdAt = null;
        Instant updatedAt = null;

        userId = orderUserId( order );
        id = order.getId();
        orderNumber = order.getOrderNumber();
        items = orderItemListToOrderItemResponseList( order.getItems() );
        subtotal = order.getSubtotal();
        shippingAmount = order.getShippingAmount();
        discountAmount = order.getDiscountAmount();
        taxAmount = order.getTaxAmount();
        totalAmount = order.getTotalAmount();
        currency = order.getCurrency();
        status = order.getStatus();
        paymentStatus = order.getPaymentStatus();
        shippingAddressSnapshot = order.getShippingAddressSnapshot();
        createdAt = order.getCreatedAt();
        updatedAt = order.getUpdatedAt();

        OrderResponse orderResponse = new OrderResponse( id, orderNumber, userId, items, subtotal, shippingAmount, discountAmount, taxAmount, totalAmount, currency, status, paymentStatus, shippingAddressSnapshot, createdAt, updatedAt );

        return orderResponse;
    }

    private Long itemProductVariantId(OrderItem orderItem) {
        if ( orderItem == null ) {
            return null;
        }
        ProductVariant productVariant = orderItem.getProductVariant();
        if ( productVariant == null ) {
            return null;
        }
        Long id = productVariant.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private Long itemProductVariantProductId(OrderItem orderItem) {
        if ( orderItem == null ) {
            return null;
        }
        ProductVariant productVariant = orderItem.getProductVariant();
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

    private String itemProductVariantProductSlug(OrderItem orderItem) {
        if ( orderItem == null ) {
            return null;
        }
        ProductVariant productVariant = orderItem.getProductVariant();
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

    private Long orderUserId(Order order) {
        if ( order == null ) {
            return null;
        }
        User user = order.getUser();
        if ( user == null ) {
            return null;
        }
        Long id = user.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    protected List<OrderItemResponse> orderItemListToOrderItemResponseList(List<OrderItem> list) {
        if ( list == null ) {
            return null;
        }

        List<OrderItemResponse> list1 = new ArrayList<OrderItemResponse>( list.size() );
        for ( OrderItem orderItem : list ) {
            list1.add( toItemResponse( orderItem ) );
        }

        return list1;
    }
}
