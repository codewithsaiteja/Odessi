package com.odessi.api.service;

import com.odessi.api.dto.request.ShippingMethodRequest;
import com.odessi.api.dto.response.ShippingCalculationResponse;
import com.odessi.api.dto.response.ShippingMethodResponse;
import com.odessi.api.entity.ShippingMethod;

import java.math.BigDecimal;
import java.util.List;

public interface ShippingService {
    List<ShippingMethodResponse> getAllActiveMethods();
    List<ShippingMethodResponse> getAllMethodsForAdmin();
    ShippingMethodResponse getMethodById(Long id);
    ShippingMethod getMethodEntityByIdOrCode(Long id, String code);
    BigDecimal calculateShippingCharge(ShippingMethod method, BigDecimal subtotal);
    ShippingCalculationResponse calculateShipping(Long methodId, String methodCode, BigDecimal subtotal);
    ShippingMethodResponse createMethod(ShippingMethodRequest request, String adminEmail);
    ShippingMethodResponse updateMethod(Long id, ShippingMethodRequest request, String adminEmail);
    void deleteMethod(Long id, String adminEmail);
}
