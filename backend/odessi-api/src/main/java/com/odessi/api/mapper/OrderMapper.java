package com.odessi.api.mapper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odessi.api.dto.response.AddressResponse;
import com.odessi.api.dto.response.OrderItemResponse;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "variantId", source = "productVariant.id")
    @Mapping(target = "productId", source = "productVariant.product.id")
    @Mapping(target = "productSlug", source = "productVariant.product.slug")
    @Mapping(target = "productName", source = "productNameSnapshot")
    @Mapping(target = "sku", source = "skuSnapshot")
    @Mapping(target = "color", source = "colorSnapshot")
    @Mapping(target = "size", source = "sizeSnapshot")
    OrderItemResponse toItemResponse(OrderItem item);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "customerEmail", expression = "java(order.getCustomerEmail())")
    @Mapping(target = "customerName", expression = "java(order.getCustomerName())")
    @Mapping(target = "razorpayOrderId", expression = "java(order.getRazorpayOrderId())")
    @Mapping(target = "razorpayPaymentId", expression = "java(order.getRazorpayPaymentId())")
    @Mapping(target = "shippingAddress", expression = "java(mapShippingAddress(order.getShippingAddressSnapshot()))")
    OrderResponse toResponse(Order order);

    default AddressResponse mapShippingAddress(String snapshotJson) {
        if (snapshotJson == null || snapshotJson.isBlank()) {
            return null;
        }
        try {
            return new ObjectMapper().readValue(snapshotJson, AddressResponse.class);
        } catch (Exception e) {
            return null;
        }
    }
}
