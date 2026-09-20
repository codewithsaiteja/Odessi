package com.odessi.api.mapper;

import com.odessi.api.dto.response.OrderItemResponse;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrderMapper {

    @Mapping(target = "variantId", source = "productVariant.id")
    OrderItemResponse toItemResponse(OrderItem item);

    @Mapping(target = "userId", source = "user.id")
    OrderResponse toResponse(Order order);
}
