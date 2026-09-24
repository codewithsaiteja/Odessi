package com.odessi.api.mapper;

import com.odessi.api.dto.response.AddressResponse;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderItem;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductVariant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("OrderMapper Tests")
class OrderMapperTest {

    private final OrderMapper mapper = Mappers.getMapper(OrderMapper.class);

    @Test
    @DisplayName("mapShippingAddress parses clean AddressResponse JSON")
    void mapShippingAddress_cleanJson() {
        String json = """
            {
              "fullName": "Aarav Sharma",
              "phone": "+919876543210",
              "addressLine1": "42 HSR Layout, Sector 2",
              "addressLine2": "Apt 301",
              "city": "Bengaluru",
              "state": "Karnataka",
              "postalCode": "560102",
              "country": "India"
            }
            """;

        AddressResponse res = mapper.mapShippingAddress(json);
        assertThat(res).isNotNull();
        assertThat(res.fullName()).isEqualTo("Aarav Sharma");
        assertThat(res.phone()).isEqualTo("+919876543210");
        assertThat(res.addressLine1()).isEqualTo("42 HSR Layout, Sector 2");
        assertThat(res.city()).isEqualTo("Bengaluru");
        assertThat(res.state()).isEqualTo("Karnataka");
        assertThat(res.postalCode()).isEqualTo("560102");
        assertThat(res.country()).isEqualTo("India");
    }

    @Test
    @DisplayName("mapShippingAddress succeeds even with unknown properties like shippingMethodId and couponCode")
    void mapShippingAddress_withUnknownProperties() {
        String json = """
            {
              "shippingMethodId": 2,
              "couponCode": "SAVE20",
              "fullName": "Priya Reddy",
              "phone": "+919123456780",
              "addressLine1": "Road No 36, Jubilee Hills",
              "city": "Hyderabad",
              "state": "Telangana",
              "postalCode": "500033",
              "randomProperty": "should_not_fail"
            }
            """;

        AddressResponse res = mapper.mapShippingAddress(json);
        assertThat(res).isNotNull();
        assertThat(res.fullName()).isEqualTo("Priya Reddy");
        assertThat(res.phone()).isEqualTo("+919123456780");
        assertThat(res.addressLine1()).isEqualTo("Road No 36, Jubilee Hills");
        assertThat(res.city()).isEqualTo("Hyderabad");
        assertThat(res.state()).isEqualTo("Telangana");
        assertThat(res.postalCode()).isEqualTo("500033");
        assertThat(res.country()).isEqualTo("India");
    }

    @Test
    @DisplayName("mapShippingAddress returns null for blank or invalid json")
    void mapShippingAddress_blankOrInvalid() {
        assertThat(mapper.mapShippingAddress(null)).isNull();
        assertThat(mapper.mapShippingAddress("")).isNull();
        assertThat(mapper.mapShippingAddress("   ")).isNull();
        assertThat(mapper.mapShippingAddress("invalid-json{")).isNull();
    }

    @Test
    @DisplayName("toResponse extracts customerName from shippingAddressSnapshot when User name is null")
    void toResponse_customerNameFallback() {
        Order order = new Order();
        order.setOrderNumber("ODR-20260924-00001");
        order.setCustomerEmail("customer@odessi.tfi");
        order.setShippingAddressSnapshot("""
            {
              "fullName": "Vikram Patel",
              "addressLine1": "MG Road",
              "city": "Mumbai",
              "state": "Maharashtra",
              "postalCode": "400001"
            }
            """);

        OrderResponse res = mapper.toResponse(order);
        assertThat(res).isNotNull();
        assertThat(res.customerName()).isEqualTo("Vikram Patel");
        assertThat(res.shippingAddress()).isNotNull();
        assertThat(res.shippingAddress().fullName()).isEqualTo("Vikram Patel");
        assertThat(res.shippingAddress().city()).isEqualTo("Mumbai");
    }

    @Test
    @DisplayName("OrderItem fallback to variant details when snapshot fields are null")
    void toItemResponse_withFallbacks() {
        Product product = new Product();
        product.setId(10L);
        product.setName("Noir Heavyweight Oversized Tee");
        product.setSlug("noir-heavyweight-tee");

        ProductVariant variant = new ProductVariant();
        variant.setId(20L);
        variant.setProduct(product);
        variant.setSku("ODS-TEE-BLK-M");
        variant.setSize("M");
        variant.setColor("Obsidian Black");
        variant.setPrice(new BigDecimal("1999.00"));

        OrderItem item = new OrderItem();
        item.setProductVariant(variant);
        item.setQuantity(2);
        item.setUnitPrice(new BigDecimal("1999.00"));
        item.setTotalPrice(new BigDecimal("3998.00"));

        // Snapshot fields intentionally not set to test fallback
        var itemRes = mapper.toItemResponse(item);
        assertThat(itemRes.productName()).isEqualTo("Noir Heavyweight Oversized Tee");
        assertThat(itemRes.sku()).isEqualTo("ODS-TEE-BLK-M");
        assertThat(itemRes.size()).isEqualTo("M");
        assertThat(itemRes.color()).isEqualTo("Obsidian Black");
        assertThat(itemRes.quantity()).isEqualTo(2);
        assertThat(itemRes.unitPrice()).isEqualByComparingTo(new BigDecimal("1999.00"));
    }
}
