package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminAuditLogResponse;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminAuditLogTest {

    @Autowired
    private AdminAuditService auditService;

    @Autowired
    private UserRepository userRepository;

    private User admin;

    @BeforeEach
    void setUp() {
        admin = new User("AuditAdmin", "Tester", "admin.audit@test.com", "hash");
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
    }

    @Test
    void logAction_recordsAdminAction() {
        auditService.logAction(admin, "TEST_ACTION", "TestEntity", "123", "Tested action details");

        Page<AdminAuditLogResponse> logs = auditService.getAuditLogs(PageRequest.of(0, 10));
        assertFalse(logs.isEmpty());

        AdminAuditLogResponse first = logs.getContent().get(0);
        assertEquals(admin.getId(), first.adminId());
        assertEquals("admin.audit@test.com", first.adminEmail());
        assertEquals("TEST_ACTION", first.action());
        assertEquals("TestEntity", first.entityType());
        assertEquals("123", first.entityId());
    }
}
