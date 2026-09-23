package com.odessi.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odessi.api.dto.request.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.odessi.api.config.AppProperties;
import com.odessi.api.config.SecurityConfig;
import com.odessi.api.exception.GlobalExceptionHandler;
import com.odessi.api.security.CustomUserDetailsService;
import com.odessi.api.security.JwtAuthenticationFilter;
import com.odessi.api.security.JwtService;
import com.odessi.api.service.AuthService;
import com.odessi.api.dto.response.UserResponse;
import com.odessi.api.entity.Role;
import java.time.Instant;

import com.odessi.api.dto.request.LoginRequest;
import com.odessi.api.entity.RefreshToken;
import com.odessi.api.entity.User;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class, AppProperties.class, JwtAuthenticationFilter.class})
class ValidationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AuthService authService;
    @MockBean JwtService jwtService;
    @MockBean CustomUserDetailsService customUserDetailsService;

    @Test
    void testValidation() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Odessi");
        request.setLastName("Tfi");
        request.setEmail("odessitfi@gmail.com");
        request.setPassword("Odessi@2026");

        given(authService.register(any())).willReturn(
            new UserResponse(1L, "Odessi", "Tfi", "odessitfi@gmail.com", null, Role.CUSTOMER, true, false, Instant.now())
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk());
    }

    @Test
    void login_validEmailFormats_accepted() throws Exception {
        String[] validEmails = {"user@gmail.com", "hello@odessi.shop", "name@example.in"};
        for (String validEmail : validEmails) {
            LoginRequest req = new LoginRequest();
            req.setEmail(validEmail);
            req.setPassword("ValidPass123");

            User mockUser = new User();
            mockUser.setId(1L);
            mockUser.setEmail(validEmail);
            mockUser.setPasswordHash("hashed");
            mockUser.setRole(Role.CUSTOMER);
            mockUser.setEnabled(true);
            mockUser.setEmailVerified(true);

            RefreshToken rt = new RefreshToken();
            rt.setTokenHash("dummy-hash");

            given(authService.authenticate(any())).willReturn(mockUser);
            given(jwtService.generateToken(any())).willReturn("mock.jwt.token");
            given(authService.createRefreshToken(any())).willReturn(rt);

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void login_invalidEmailFormats_rejected() throws Exception {
        String[] invalidEmails = {"user", "user@", "@gmail.com", "user@gmail", "   "};
        for (String invalidEmail : invalidEmails) {
            LoginRequest req = new LoginRequest();
            req.setEmail(invalidEmail);
            req.setPassword("ValidPass123");

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().is4xxClientError());
        }
    }
}
