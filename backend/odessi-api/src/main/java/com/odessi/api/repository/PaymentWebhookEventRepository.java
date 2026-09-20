package com.odessi.api.repository;

import com.odessi.api.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {

    boolean existsByRazorpayEventId(String razorpayEventId);

    Optional<PaymentWebhookEvent> findByRazorpayEventId(String razorpayEventId);
}
