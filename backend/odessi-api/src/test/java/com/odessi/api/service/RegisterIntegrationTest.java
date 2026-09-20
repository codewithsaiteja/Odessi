package com.odessi.api.service;

import com.odessi.api.dto.request.RegisterRequest;
import com.odessi.api.dto.response.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
class RegisterIntegrationTest {

    @Autowired
    private AuthService authService;

    @Test
    void testRegister() {
        RegisterRequest req = new RegisterRequest();
        req.setFirstName("Odessi");
        req.setLastName("Tfi");
        req.setEmail("testintegration@odessi.tfi");
        req.setPassword("Odessi@2026");

        UserResponse res = authService.register(req);
        assertNotNull(res);
        assertNotNull(res.id());
    }
}
