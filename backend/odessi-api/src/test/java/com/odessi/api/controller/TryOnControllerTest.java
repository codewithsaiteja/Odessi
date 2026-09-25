package com.odessi.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odessi.api.config.AppProperties;
import com.odessi.api.config.SecurityConfig;
import com.odessi.api.dto.request.TryOnTokenRequest;
import com.odessi.api.dto.response.TryOnConfigResponse;
import com.odessi.api.dto.response.TryOnTokenResponse;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.GlobalExceptionHandler;
import com.odessi.api.security.CustomUserDetailsService;
import com.odessi.api.security.JwtAuthenticationFilter;
import com.odessi.api.security.JwtService;
import com.odessi.api.security.RateLimitingFilter;
import com.odessi.api.service.DecartTryOnService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TryOnController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class, AppProperties.class,
         JwtService.class, JwtAuthenticationFilter.class, RateLimitingFilter.class})
@DisplayName("TryOnController integration tests")
class TryOnControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    DecartTryOnService tryOnService;

    @MockBean
    CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("GET /api/try-on/config — returns 200 with config")
    void getConfig_returns200() throws Exception {
        given(tryOnService.getConfig()).willReturn(new TryOnConfigResponse(true, "lucy-vton-3.5"));

        mockMvc.perform(get("/api/try-on/config").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.configured").value(true))
                .andExpect(jsonPath("$.data.model").value("lucy-vton-3.5"));
    }

    @Test
    @DisplayName("POST /api/try-on/token — returns 200 with client token and garment URL")
    void createToken_returns200() throws Exception {
        TryOnTokenResponse response = new TryOnTokenResponse(
                "dct_ephemeral_token_123",
                "2026-09-25T20:30:00Z",
                "lucy-vton-3.5",
                "https://odessi-backend.onrender.com/api/media/products/prod-123.jpg",
                "Mahesh Babu Hoodie"
        );

        given(tryOnService.createClientToken(any(TryOnTokenRequest.class), anyString()))
                .willReturn(response);

        TryOnTokenRequest request = new TryOnTokenRequest(20L, "mahesh-babu-hoodie", null);

        mockMvc.perform(post("/api/try-on/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.clientToken").value("dct_ephemeral_token_123"))
                .andExpect(jsonPath("$.data.model").value("lucy-vton-3.5"))
                .andExpect(jsonPath("$.data.garmentImageUrl").value("https://odessi-backend.onrender.com/api/media/products/prod-123.jpg"));
    }

    @Test
    @DisplayName("POST /api/try-on/token — returns 422 when Try-On unavailable")
    void createToken_unavailable_returns422() throws Exception {
        given(tryOnService.createClientToken(any(TryOnTokenRequest.class), anyString()))
                .willThrow(BusinessException.tryOnUnavailable("Virtual Try-On is currently unavailable."));

        TryOnTokenRequest request = new TryOnTokenRequest(20L, "mahesh-babu-hoodie", null);

        mockMvc.perform(post("/api/try-on/token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").value("TRY_ON_UNAVAILABLE"))
                .andExpect(jsonPath("$.message").value("Virtual Try-On is currently unavailable."));
    }
}
