package com.odessi.api.mapper;

import com.odessi.api.dto.response.AddressResponse;
import com.odessi.api.entity.Address;
import java.time.Instant;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-09-22T00:05:32+0530",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 25.0.2 (Oracle Corporation)"
)
@Component
public class AddressMapperImpl implements AddressMapper {

    @Override
    public AddressResponse toResponse(Address address) {
        if ( address == null ) {
            return null;
        }

        Long id = null;
        String fullName = null;
        String phone = null;
        String addressLine1 = null;
        String addressLine2 = null;
        String city = null;
        String state = null;
        String postalCode = null;
        String country = null;
        boolean isDefault = false;
        Instant createdAt = null;

        id = address.getId();
        fullName = address.getFullName();
        phone = address.getPhone();
        addressLine1 = address.getAddressLine1();
        addressLine2 = address.getAddressLine2();
        city = address.getCity();
        state = address.getState();
        postalCode = address.getPostalCode();
        country = address.getCountry();
        isDefault = address.isIsDefault();
        createdAt = address.getCreatedAt();

        AddressResponse addressResponse = new AddressResponse( id, fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault, createdAt );

        return addressResponse;
    }
}
