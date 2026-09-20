package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminAuditLogResponse;
import com.odessi.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminAuditService {
    void logAction(User admin, String action, String entityType, String entityId, String details);
    Page<AdminAuditLogResponse> getAuditLogs(Pageable pageable);
}
