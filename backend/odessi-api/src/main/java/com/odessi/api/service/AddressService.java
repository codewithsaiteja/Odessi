package com.odessi.api.service;

import com.odessi.api.dto.request.CreateAddressRequest;
import com.odessi.api.dto.request.UpdateAddressRequest;
import com.odessi.api.dto.response.AddressResponse;

import java.util.List;

public interface AddressService {

    List<AddressResponse> findByUser(Long userId);

    AddressResponse create(Long userId, CreateAddressRequest request);

    AddressResponse update(Long userId, Long addressId, UpdateAddressRequest request);

    void delete(Long userId, Long addressId);
}
