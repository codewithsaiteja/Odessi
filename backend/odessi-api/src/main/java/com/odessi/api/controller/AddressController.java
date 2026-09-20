package com.odessi.api.controller;

import com.odessi.api.dto.request.CreateAddressRequest;
import com.odessi.api.dto.request.UpdateAddressRequest;
import com.odessi.api.dto.response.AddressResponse;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.service.AddressService;
import com.odessi.api.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@Tag(name = "Addresses", description = "User shipping address management")
public class AddressController {

    private final AddressService addressService;
    private final AuthService authService;

    public AddressController(AddressService addressService, AuthService authService) {
        this.addressService = addressService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get all addresses for current user")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> listAddresses() {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(ApiResponse.ok(addressService.findByUser(userId)));
    }

    @PostMapping
    @Operation(summary = "Create a new address")
    public ResponseEntity<ApiResponse<AddressResponse>> create(@Valid @RequestBody CreateAddressRequest request) {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponse.created(addressService.create(userId, request)));
    }

    @RequestMapping(value = "/{id}", method = {RequestMethod.PUT, RequestMethod.PATCH})
    @Operation(summary = "Update an address")
    public ResponseEntity<ApiResponse<AddressResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAddressRequest request) {
        Long userId = authService.getCurrentUser().getId();
        return ResponseEntity.ok(ApiResponse.ok(addressService.update(userId, id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an address")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = authService.getCurrentUser().getId();
        addressService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
