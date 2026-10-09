package com.odessi.api.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;

public record SellerRewardClaimRequest(
    @JsonProperty("fullName")
    @Size(max = 150)
    String fullName,

    @JsonProperty("shippingFullName")
    @Size(max = 150)
    String shippingFullName,

    @JsonProperty("phone")
    @Size(max = 50)
    String phone,

    @JsonProperty("shippingPhone")
    @Size(max = 50)
    String shippingPhone,

    @JsonProperty("addressLine1")
    @Size(max = 255)
    String addressLine1,

    @JsonProperty("shippingAddressLine1")
    @Size(max = 255)
    String shippingAddressLine1,

    @JsonProperty("addressLine2")
    String addressLine2,

    @JsonProperty("shippingAddressLine2")
    String shippingAddressLine2,

    @JsonProperty("city")
    @Size(max = 100)
    String city,

    @JsonProperty("shippingCity")
    @Size(max = 100)
    String shippingCity,

    @JsonProperty("state")
    @Size(max = 100)
    String state,

    @JsonProperty("shippingState")
    @Size(max = 100)
    String shippingState,

    @JsonProperty("postalCode")
    @Size(max = 20)
    String postalCode,

    @JsonProperty("shippingPostalCode")
    @Size(max = 20)
    String shippingPostalCode,

    @JsonProperty("tshirtSize")
    String tshirtSize
) {
    public SellerRewardClaimRequest(
        String fullName, String phone, String addressLine1, String addressLine2,
        String city, String state, String postalCode, String tshirtSize
    ) {
        this(fullName, fullName, phone, phone, addressLine1, addressLine1, addressLine2, addressLine2, city, city, state, state, postalCode, postalCode, tshirtSize);
    }

    public String getEffectiveFullName() {
        return (shippingFullName != null && !shippingFullName.isBlank()) ? shippingFullName.trim() : (fullName != null ? fullName.trim() : "");
    }
    public String getEffectivePhone() {
        return (shippingPhone != null && !shippingPhone.isBlank()) ? shippingPhone.trim() : (phone != null ? phone.trim() : "");
    }
    public String getEffectiveAddressLine1() {
        return (shippingAddressLine1 != null && !shippingAddressLine1.isBlank()) ? shippingAddressLine1.trim() : (addressLine1 != null ? addressLine1.trim() : "");
    }
    public String getEffectiveAddressLine2() {
        return (shippingAddressLine2 != null && !shippingAddressLine2.isBlank()) ? shippingAddressLine2.trim() : (addressLine2 != null ? addressLine2.trim() : null);
    }
    public String getEffectiveCity() {
        return (shippingCity != null && !shippingCity.isBlank()) ? shippingCity.trim() : (city != null ? city.trim() : "");
    }
    public String getEffectiveState() {
        return (shippingState != null && !shippingState.isBlank()) ? shippingState.trim() : (state != null ? state.trim() : "Telangana");
    }
    public String getEffectivePostalCode() {
        return (shippingPostalCode != null && !shippingPostalCode.isBlank()) ? shippingPostalCode.trim() : (postalCode != null ? postalCode.trim() : "");
    }
}

