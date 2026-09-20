package com.odessi.api.service;

import com.odessi.api.dto.request.BackInStockSubscribeRequest;
import com.odessi.api.dto.response.BackInStockResponse;
import com.odessi.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BackInStockService {
    BackInStockResponse subscribe(User user, BackInStockSubscribeRequest request);
    Page<BackInStockResponse> getDemandList(Pageable pageable);
}
