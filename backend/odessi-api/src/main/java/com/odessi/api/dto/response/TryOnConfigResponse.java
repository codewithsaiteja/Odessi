package com.odessi.api.dto.response;

public record TryOnConfigResponse(
    boolean configured,
    String model
) {}
