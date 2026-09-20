package com.odessi.api.dto.request;

public record CreateOrderRequest(
    Long addressId,
    String fullName,
    String phone,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String postalCode,
    String country,
    Long shippingMethodId,
    String shippingMethodCode,
    String couponCode
) {
    public CreateOrderRequest(
        Long addressId,
        String fullName,
        String phone,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String postalCode,
        String country
    ) {
        this(addressId, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, null, null, null);
    }

    public CreateOrderRequest(Long addressId) {
        this(addressId, null, null, null, null, null, null, null, null, null, null, null);
    }
}
