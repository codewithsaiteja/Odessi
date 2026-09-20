package com.odessi.api.service.impl;

import com.odessi.api.dto.admin.AdminAuditLogResponse;
import com.odessi.api.entity.AdminAuditLog;
import com.odessi.api.entity.User;
import com.odessi.api.repository.AdminAuditLogRepository;
import com.odessi.api.service.AdminAuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuditServiceImpl implements AdminAuditService {

    private final AdminAuditLogRepository auditLogRepository;

    public AdminAuditServiceImpl(AdminAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Transactional
    public void logAction(User admin, String action, String entityType, String entityId, String details) {
        Long adminId = (admin != null && admin.getId() != null) ? admin.getId() : 0L;
        String adminEmail = (admin != null && admin.getEmail() != null) ? admin.getEmail() : "system@odessi.tfi";

        AdminAuditLog log = new AdminAuditLog(
            adminId,
            adminEmail,
            action,
            entityType,
            entityId,
            details
        );
        auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminAuditLogResponse> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
            .map(log -> new AdminAuditLogResponse(
                log.getId(),
                log.getAdminId(),
                log.getAdminEmail(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDetails(),
                log.getCreatedAt()
            ));
    }
}
