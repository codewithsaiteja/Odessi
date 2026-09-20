package com.odessi.api.repository;

import com.odessi.api.entity.ShippingMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShippingMethodRepository extends JpaRepository<ShippingMethod, Long> {
    List<ShippingMethod> findByActiveTrue();
    Optional<ShippingMethod> findByCodeAndActiveTrue(String code);
    Optional<ShippingMethod> findByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);
    boolean existsByCode(String code);
}
