package com.odessi.api.service;

import com.odessi.api.dto.request.CustomOrderRequest;
import com.odessi.api.dto.response.CustomOrderResponse;
import com.odessi.api.entity.CustomOrderStatus;
import com.odessi.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomOrderService {
    CustomOrderResponse submitInquiry(CustomOrderRequest request);
    Page<CustomOrderResponse> getInquiries(CustomOrderStatus status, String search, Pageable pageable);
    CustomOrderResponse getInquiryById(Long id);
    CustomOrderResponse updateStatus(User admin, Long id, CustomOrderStatus newStatus);
    CustomOrderResponse updateInternalNotes(User admin, Long id, String internalNotes);
}
