package com.odessi.api.service.impl;

import com.odessi.api.dto.request.ShippingMethodRequest;
import com.odessi.api.dto.response.ShippingCalculationResponse;
import com.odessi.api.dto.response.ShippingMethodResponse;
import com.odessi.api.entity.ShippingMethod;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.ShippingMethodRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.AdminAuditService;
import com.odessi.api.service.ShippingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ShippingServiceImpl implements ShippingService {

    private final ShippingMethodRepository shippingMethodRepository;
    private final UserRepository userRepository;
    private final AdminAuditService auditService;

    public ShippingServiceImpl(
            ShippingMethodRepository shippingMethodRepository,
            UserRepository userRepository,
            AdminAuditService auditService) {
        this.shippingMethodRepository = shippingMethodRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    private ShippingMethodResponse toResponse(ShippingMethod m) {
        return new ShippingMethodResponse(
            m.getId(),
            m.getName(),
            m.getCode(),
            m.getCharge(),
            m.getFreeShippingThreshold(),
            m.getEstimatedDays(),
            m.isActive(),
            m.getCreatedAt(),
            m.getUpdatedAt()
        );
    }

    @Override
    public List<ShippingMethodResponse> getAllActiveMethods() {
        return shippingMethodRepository.findByActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<ShippingMethodResponse> getAllMethodsForAdmin() {
        return shippingMethodRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ShippingMethodResponse getMethodById(Long id) {
        ShippingMethod m = shippingMethodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SHIPPING_METHOD_NOT_FOUND", "Shipping method not found: " + id));
        return toResponse(m);
    }

    @Override
    public ShippingMethod getMethodEntityByIdOrCode(Long id, String code) {
        if (id != null) {
            return shippingMethodRepository.findById(id)
                    .orElseGet(() -> code != null ? shippingMethodRepository.findByCodeAndActiveTrue(code).orElse(null) : null);
        } else if (code != null && !code.isBlank()) {
            return shippingMethodRepository.findByCodeAndActiveTrue(code).orElse(null);
        }
        return null;
    }

    @Override
    public BigDecimal calculateShippingCharge(ShippingMethod method, BigDecimal subtotal) {
        if (method == null || !method.isActive()) {
            if (subtotal != null && subtotal.compareTo(new BigDecimal("1999")) >= 0) {
                return BigDecimal.ZERO;
            }
            return new BigDecimal("150.00");
        }
        if (method.getFreeShippingThreshold() != null && subtotal != null && subtotal.compareTo(method.getFreeShippingThreshold()) >= 0) {
            return BigDecimal.ZERO;
        }
        return method.getCharge();
    }

    @Override
    public ShippingCalculationResponse calculateShipping(Long methodId, String methodCode, BigDecimal subtotal) {
        ShippingMethod method = getMethodEntityByIdOrCode(methodId, methodCode);
        if (method == null) {
            List<ShippingMethod> actives = shippingMethodRepository.findByActiveTrue();
            if (!actives.isEmpty()) {
                method = actives.get(0);
            }
        }
        BigDecimal charge = calculateShippingCharge(method, subtotal);
        boolean isFree = (charge.compareTo(BigDecimal.ZERO) == 0);

        return new ShippingCalculationResponse(
            method != null ? method.getId() : null,
            method != null ? method.getName() : "Standard Delivery",
            method != null ? method.getCode() : "STANDARD",
            subtotal,
            charge,
            method != null ? method.getFreeShippingThreshold() : new BigDecimal("1999"),
            isFree
        );
    }

    @Override
    @Transactional
    public ShippingMethodResponse createMethod(ShippingMethodRequest request, String adminEmail) {
        if (shippingMethodRepository.existsByCode(request.code().toUpperCase())) {
            throw new BadRequestException("Shipping method code already exists: " + request.code());
        }

        ShippingMethod m = new ShippingMethod();
        m.setName(request.name());
        m.setCode(request.code().toUpperCase());
        m.setCharge(request.charge());
        m.setFreeShippingThreshold(request.freeShippingThreshold());
        m.setEstimatedDays(request.estimatedDays());
        m.setActive(request.active() != null ? request.active() : true);

        ShippingMethod saved = shippingMethodRepository.save(m);
        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(admin, "SHIPPING_METHOD_CREATED", "ShippingMethod", saved.getId().toString(), "Created shipping method " + saved.getName());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public ShippingMethodResponse updateMethod(Long id, ShippingMethodRequest request, String adminEmail) {
        ShippingMethod m = shippingMethodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SHIPPING_METHOD_NOT_FOUND", "Shipping method not found: " + id));

        if (shippingMethodRepository.existsByCodeAndIdNot(request.code().toUpperCase(), id)) {
            throw new BadRequestException("Shipping method code already in use: " + request.code());
        }

        m.setName(request.name());
        m.setCode(request.code().toUpperCase());
        m.setCharge(request.charge());
        m.setFreeShippingThreshold(request.freeShippingThreshold());
        m.setEstimatedDays(request.estimatedDays());
        if (request.active() != null) {
            m.setActive(request.active());
        }

        ShippingMethod saved = shippingMethodRepository.save(m);
        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(admin, "SHIPPING_METHOD_UPDATED", "ShippingMethod", saved.getId().toString(), "Updated shipping method " + saved.getName());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteMethod(Long id, String adminEmail) {
        ShippingMethod m = shippingMethodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SHIPPING_METHOD_NOT_FOUND", "Shipping method not found: " + id));
        shippingMethodRepository.delete(m);
        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(admin, "SHIPPING_METHOD_DELETED", "ShippingMethod", id.toString(), "Deleted shipping method " + m.getName());
    }
}
