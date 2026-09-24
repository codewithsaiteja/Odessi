package com.odessi.api.mapper;

import com.fasterxml.jackson.databind.DeserializationFeature;
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

    ObjectMapper OBJECT_MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

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
            AddressResponse parsed = null;
            try {
                parsed = OBJECT_MAPPER.readValue(snapshotJson, AddressResponse.class);
            } catch (Exception ignored) {
            }
            if (parsed != null) {
                if (parsed.country() == null || parsed.country().isBlank()) {
                    return new AddressResponse(
                            parsed.id(),
                            parsed.fullName(),
                            parsed.phone(),
                            parsed.addressLine1(),
                            parsed.addressLine2(),
                            parsed.city(),
                            parsed.state(),
                            parsed.postalCode(),
                            "India",
                            parsed.isDefault(),
                            parsed.createdAt()
                    );
                }
                return parsed;
            }
            com.fasterxml.jackson.databind.JsonNode root = OBJECT_MAPPER.readTree(snapshotJson);
            if (root == null || !root.isObject()) {
                return null;
            }
            String fullName = getFieldText(root, "fullName", "name", "customerName");
            String phone = getFieldText(root, "phone", "phoneNumber");
            String line1 = getFieldText(root, "addressLine1", "address_line_1", "line1", "address");
            String line2 = getFieldText(root, "addressLine2", "address_line_2", "line2");
            String city = getFieldText(root, "city");
            String state = getFieldText(root, "state");
            String postalCode = getFieldText(root, "postalCode", "postal_code", "pincode", "zipCode", "zip");
            String country = getFieldText(root, "country");
            if (country == null || country.isBlank()) {
                country = "India";
            }
            return new AddressResponse(null, fullName, phone, line1, line2, city, state, postalCode, country, false, null);
        } catch (Exception e) {
            return null;
        }
    }

    private String getFieldText(com.fasterxml.jackson.databind.JsonNode root, String... fieldNames) {
        for (String fieldName : fieldNames) {
            if (root.hasNonNull(fieldName)) {
                String val = root.get(fieldName).asText();
                if (!val.isBlank()) {
                    return val;
                }
            }
        }
        return null;
    }
}
