package com.odessi.api.service;

import com.odessi.api.dto.request.ShippingMethodRequest;
import com.odessi.api.dto.response.ShippingCalculationResponse;
import com.odessi.api.dto.response.ShippingMethodResponse;
import com.odessi.api.entity.ShippingMethod;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.ShippingMethodRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.impl.ShippingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShippingServiceTest {

    @Mock
    private ShippingMethodRepository shippingMethodRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AdminAuditService auditService;

    private ShippingServiceImpl shippingService;

    private ShippingMethod standardMethod;
    private ShippingMethod expressMethod;

    @BeforeEach
    void setUp() {
        shippingService = new ShippingServiceImpl(shippingMethodRepository, userRepository, auditService);

        standardMethod = new ShippingMethod();
        standardMethod.setId(1L);
        standardMethod.setName("Standard Delivery");
        standardMethod.setCode("STANDARD");
        standardMethod.setCharge(new BigDecimal("150.00"));
        standardMethod.setFreeShippingThreshold(new BigDecimal("1999.00"));
        standardMethod.setEstimatedDays("3-5 Business Days");
        standardMethod.setActive(true);

        expressMethod = new ShippingMethod();
        expressMethod.setId(2L);
        expressMethod.setName("Express Delivery");
        expressMethod.setCode("EXPRESS");
        expressMethod.setCharge(new BigDecimal("300.00"));
        expressMethod.setFreeShippingThreshold(null);
        expressMethod.setEstimatedDays("1-2 Business Days");
        expressMethod.setActive(true);
    }

    @Test
    @DisplayName("calculateShipping: returns free shipping when subtotal >= threshold")
    void calculateShipping_FreeShipping() {
        when(shippingMethodRepository.findById(1L)).thenReturn(Optional.of(standardMethod));

        ShippingCalculationResponse result = shippingService.calculateShipping(1L, "STANDARD", new BigDecimal("2000.00"));

        assertThat(result.charge()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.isFreeShipping()).isTrue();
    }

    @Test
    @DisplayName("calculateShipping: returns charge when subtotal < threshold")
    void calculateShipping_ChargeApplied() {
        when(shippingMethodRepository.findById(1L)).thenReturn(Optional.of(standardMethod));

        ShippingCalculationResponse result = shippingService.calculateShipping(1L, "STANDARD", new BigDecimal("1000.00"));

        assertThat(result.charge()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(result.isFreeShipping()).isFalse();
    }

    @Test
    @DisplayName("calculateShipping: returns express charge without free shipping")
    void calculateShipping_ExpressCharge() {
        when(shippingMethodRepository.findById(2L)).thenReturn(Optional.of(expressMethod));

        ShippingCalculationResponse result = shippingService.calculateShipping(2L, "EXPRESS", new BigDecimal("5000.00"));

        assertThat(result.charge()).isEqualByComparingTo(new BigDecimal("300.00"));
        assertThat(result.isFreeShipping()).isFalse();
    }

    @Test
    @DisplayName("createMethod: throws exception on duplicate code")
    void createMethod_DuplicateCodeThrows() {
        when(shippingMethodRepository.existsByCode("STANDARD")).thenReturn(true);

        ShippingMethodRequest request = new ShippingMethodRequest("Standard", "STANDARD", new BigDecimal("150.00"), new BigDecimal("1999.00"), "3 days", true);

        assertThatThrownBy(() -> shippingService.createMethod(request, "admin@odessi.com"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Shipping method code already exists");
    }

    @Test
    @DisplayName("createMethod: saves new shipping method and logs audit event")
    void createMethod_Success() {
        when(shippingMethodRepository.existsByCode("OVERNIGHT")).thenReturn(false);
        when(shippingMethodRepository.save(any(ShippingMethod.class))).thenAnswer(invocation -> {
            ShippingMethod m = invocation.getArgument(0);
            m.setId(3L);
            return m;
        });

        ShippingMethodRequest request = new ShippingMethodRequest("Overnight Delivery", "OVERNIGHT", new BigDecimal("500.00"), null, "1 Day", true);
        ShippingMethodResponse response = shippingService.createMethod(request, "admin@odessi.com");

        assertThat(response.id()).isEqualTo(3L);
        assertThat(response.code()).isEqualTo("OVERNIGHT");
        assertThat(response.charge()).isEqualByComparingTo(new BigDecimal("500.00"));
        verify(auditService, times(1)).logAction(any(), eq("SHIPPING_METHOD_CREATED"), eq("ShippingMethod"), eq("3"), any());
    }
}
