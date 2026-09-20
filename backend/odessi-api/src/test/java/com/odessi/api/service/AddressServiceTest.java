package com.odessi.api.service;

import com.odessi.api.dto.request.CreateAddressRequest;
import com.odessi.api.dto.request.UpdateAddressRequest;
import com.odessi.api.dto.response.AddressResponse;
import com.odessi.api.entity.Address;
import com.odessi.api.entity.User;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.AddressMapper;
import com.odessi.api.repository.AddressRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.impl.AddressServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AddressService unit & security tests")
class AddressServiceTest {

    @Mock private AddressRepository addressRepository;
    @Mock private UserRepository userRepository;
    @Mock private AddressMapper addressMapper;

    private AddressServiceImpl addressService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        addressService = new AddressServiceImpl(addressRepository, userRepository, addressMapper);

        userA = new User("Aarav", "Sharma", "aarav@example.com", "hash");
        userA.setId(10L);

        userB = new User("Bhavna", "Patel", "bhavna@example.com", "hash");
        userB.setId(20L);
    }

    @Test
    @DisplayName("findByUser — returns addresses belonging to authenticated user")
    void findByUser_success() {
        Address addr = new Address();
        addr.setId(101L);
        addr.setUser(userA);
        addr.setFullName("Aarav Sharma");

        given(addressRepository.findByUserId(10L)).willReturn(List.of(addr));
        AddressResponse mockResponse = new AddressResponse(101L, "Aarav Sharma", "9876543210", "123 Street", null, "Mumbai", "Maharashtra", "400001", "India", true, null);
        given(addressMapper.toResponse(addr)).willReturn(mockResponse);

        List<AddressResponse> result = addressService.findByUser(10L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).fullName()).isEqualTo("Aarav Sharma");
        then(addressRepository).should().findByUserId(10L);
    }

    @Test
    @DisplayName("create — first address for user automatically becomes default")
    void create_firstAddress_becomesDefault() {
        given(userRepository.findById(10L)).willReturn(Optional.of(userA));
        given(addressRepository.findByUserId(10L)).willReturn(Collections.emptyList());

        CreateAddressRequest request = new CreateAddressRequest(
            "Aarav Sharma", "9876543210", "Line 1", "Line 2",
            "Mumbai", "Maharashtra", "400001", "India", false
        );

        given(addressRepository.save(any(Address.class))).willAnswer(invocation -> {
            Address saved = invocation.getArgument(0);
            saved.setId(101L);
            return saved;
        });

        addressService.create(10L, request);

        then(addressRepository).should().clearDefaultForUser(10L);
        then(addressRepository).should().save(argThat(Address::isIsDefault));
    }

    @Test
    @DisplayName("create — setting default address unsets previous default")
    void create_subsequentAddress_explicitDefault_unsetsOldDefault() {
        Address existingAddr = new Address();
        existingAddr.setId(101L);
        existingAddr.setUser(userA);
        existingAddr.setDefault(true);

        given(userRepository.findById(10L)).willReturn(Optional.of(userA));
        given(addressRepository.findByUserId(10L)).willReturn(List.of(existingAddr));

        CreateAddressRequest request = new CreateAddressRequest(
            "Aarav Work", "9876543210", "Office Tech Park", null,
            "Mumbai", "Maharashtra", "400051", "India", true
        );

        given(addressRepository.save(any(Address.class))).willAnswer(invocation -> invocation.getArgument(0));

        addressService.create(10L, request);

        then(addressRepository).should().clearDefaultForUser(10L);
        then(addressRepository).should().save(argThat(Address::isIsDefault));
    }

    @Test
    @DisplayName("update — IDOR protection: User A cannot update User B address")
    void update_idor_throwsNotFound() {
        // User A (10L) attempts to update Address 202 belonging to User B
        given(addressRepository.findByIdAndUserId(202L, 10L)).willReturn(Optional.empty());

        UpdateAddressRequest request = new UpdateAddressRequest(
            "Hacked Name", null, null, null, null, null, null, null, null
        );

        assertThatThrownBy(() -> addressService.update(10L, 202L, request))
            .isInstanceOf(ResourceNotFoundException.class);

        then(addressRepository).should(never()).save(any());
    }

    @Test
    @DisplayName("delete — IDOR protection: User A cannot delete User B address")
    void delete_idor_throwsNotFound() {
        // User A (10L) attempts to delete Address 202 belonging to User B
        given(addressRepository.findByIdAndUserId(202L, 10L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> addressService.delete(10L, 202L))
            .isInstanceOf(ResourceNotFoundException.class);

        then(addressRepository).should(never()).delete(any());
    }

    @Test
    @DisplayName("delete — deleting default address promotes first remaining address to default")
    void delete_defaultAddress_promotesRemainingToDefault() {
        Address defaultAddr = new Address();
        defaultAddr.setId(101L);
        defaultAddr.setUser(userA);
        defaultAddr.setDefault(true);

        Address remainingAddr = new Address();
        remainingAddr.setId(102L);
        remainingAddr.setUser(userA);
        remainingAddr.setDefault(false);

        given(addressRepository.findByIdAndUserId(101L, 10L)).willReturn(Optional.of(defaultAddr));
        given(addressRepository.findByUserId(10L)).willReturn(List.of(remainingAddr));

        addressService.delete(10L, 101L);

        then(addressRepository).should().delete(defaultAddr);
        then(addressRepository).should().save(argThat(a -> a.getId().equals(102L) && a.isIsDefault()));
    }
}
