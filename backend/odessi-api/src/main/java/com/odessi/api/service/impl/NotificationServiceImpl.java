package com.odessi.api.service.impl;

import com.odessi.api.entity.BackInStockRequest;
import com.odessi.api.entity.BackInStockStatus;
import com.odessi.api.entity.ProductVariant;
import com.odessi.api.repository.BackInStockRepository;
import com.odessi.api.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final BackInStockRepository backInStockRepository;

    public NotificationServiceImpl(BackInStockRepository backInStockRepository) {
        this.backInStockRepository = backInStockRepository;
    }

    @Override
    @Transactional
    public void dispatchBackInStockNotifications(ProductVariant variant) {
        if (variant == null || variant.getId() == null) return;

        List<BackInStockRequest> pendingRequests = backInStockRepository.findByVariantIdAndStatus(
            variant.getId(), BackInStockStatus.PENDING
        );

        if (pendingRequests.isEmpty()) {
            return;
        }

        log.info("Dispatching back-in-stock notifications for variant SKU: {} to {} subscriber(s)",
            variant.getSku(), pendingRequests.size());

        for (BackInStockRequest request : pendingRequests) {
            log.info("Back-in-stock notification event generated for subscriber email: {} (Variant SKU: {})",
                request.getEmail(), variant.getSku());
            request.setStatus(BackInStockStatus.NOTIFIED);
            backInStockRepository.save(request);
        }
    }
}
