package com.odessi.api.mapper;

import com.odessi.api.dto.response.AddressResponse;
import com.odessi.api.entity.Address;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    AddressResponse toResponse(Address address);
}
