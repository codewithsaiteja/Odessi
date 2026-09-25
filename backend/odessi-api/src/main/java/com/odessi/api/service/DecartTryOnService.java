package com.odessi.api.service;

import com.odessi.api.dto.request.TryOnTokenRequest;
import com.odessi.api.dto.response.TryOnConfigResponse;
import com.odessi.api.dto.response.TryOnTokenResponse;

public interface DecartTryOnService {
    TryOnConfigResponse getConfig();
    TryOnTokenResponse createClientToken(TryOnTokenRequest request, String clientIp);
}
