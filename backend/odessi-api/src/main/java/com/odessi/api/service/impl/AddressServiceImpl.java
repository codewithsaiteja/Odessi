package com.odessi.api.service.impl;

import com.odessi.api.dto.request.CreateAddressRequest;
import com.odessi.api.dto.request.UpdateAddressRequest;
import com.odessi.api.dto.response.AddressResponse;
import com.odessi.api.entity.Address;
import com.odessi.api.entity.User;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.AddressMapper;
import com.odessi.api.repository.AddressRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.AddressService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AddressServiceImpl implements AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final AddressMapper addressMapper;

    public AddressServiceImpl(
            AddressRepository addressRepository,
            UserRepository userRepository,
            AddressMapper addressMapper) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
        this.addressMapper = addressMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> findByUser(Long userId) {
        return addressRepository.findByUserId(userId)
            .stream()
            .map(addressMapper::toResponse)
            .toList();
    }

    @Override
    public AddressResponse create(Long userId, CreateAddressRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ResourceNotFoundException.user(userId));

        List<Address> existing = addressRepository.findByUserId(userId);
        boolean shouldBeDefault = request.isDefault() || existing.isEmpty();

        if (shouldBeDefault) {
            // Clear existing default before setting new one
            addressRepository.clearDefaultForUser(userId);
        }

        Address address = new Address();
        address.setUser(user);
        address.setFullName(request.fullName());
        address.setPhone(request.phone());
        address.setAddressLine1(request.addressLine1());
        address.setAddressLine2(request.addressLine2());
        address.setCity(request.city());
        address.setState(request.state());
        address.setPostalCode(request.postalCode());
        address.setCountry(request.country() != null && !request.country().isBlank() ? request.country() : "India");
        address.setDefault(shouldBeDefault);

        return addressMapper.toResponse(addressRepository.save(address));
    }

    @Override
    public AddressResponse update(Long userId, Long addressId, UpdateAddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
            .orElseThrow(() -> ResourceNotFoundException.address(addressId));

        if (request.fullName() != null) address.setFullName(request.fullName());
        if (request.phone() != null) address.setPhone(request.phone());
        if (request.addressLine1() != null) address.setAddressLine1(request.addressLine1());
        if (request.addressLine2() != null) address.setAddressLine2(request.addressLine2());
        if (request.city() != null) address.setCity(request.city());
        if (request.state() != null) address.setState(request.state());
        if (request.postalCode() != null) address.setPostalCode(request.postalCode());
        if (request.country() != null) address.setCountry(request.country());

        if (Boolean.TRUE.equals(request.isDefault())) {
            addressRepository.clearDefaultForUser(userId);
            address.setDefault(true);
        }

        return addressMapper.toResponse(addressRepository.save(address));
    }

    @Override
    public void delete(Long userId, Long addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
            .orElseThrow(() -> ResourceNotFoundException.address(addressId));
        boolean wasDefault = address.isIsDefault();

        addressRepository.delete(address);
        addressRepository.flush();

        if (wasDefault) {
            List<Address> remaining = addressRepository.findByUserId(userId);
            if (!remaining.isEmpty()) {
                Address newDefault = remaining.get(0);
                newDefault.setDefault(true);
                addressRepository.save(newDefault);
            }
        }
    }
}
