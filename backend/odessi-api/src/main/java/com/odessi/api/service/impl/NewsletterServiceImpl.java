package com.odessi.api.service.impl;

import com.odessi.api.dto.newsletter.NewsletterResponse;
import com.odessi.api.dto.newsletter.NewsletterSubscribeRequest;
import com.odessi.api.entity.NewsletterSubscriber;
import com.odessi.api.repository.NewsletterSubscriberRepository;
import com.odessi.api.service.NewsletterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class NewsletterServiceImpl implements NewsletterService {

    private static final Logger log = LoggerFactory.getLogger(NewsletterServiceImpl.class);
    private static final String WELCOME_COUPON_CODE = "WELCOME10";

    private final NewsletterSubscriberRepository subscriberRepository;

    public NewsletterServiceImpl(NewsletterSubscriberRepository subscriberRepository) {
        this.subscriberRepository = subscriberRepository;
    }

    @Override
    @Transactional
    public NewsletterResponse subscribe(NewsletterSubscribeRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        Optional<NewsletterSubscriber> existingOpt = subscriberRepository.findByEmailIgnoreCase(normalizedEmail);

        NewsletterSubscriber subscriber;
        String message;

        if (existingOpt.isPresent()) {
            subscriber = existingOpt.get();
            if (subscriber.isActive()) {
                message = "You are already part of the Odessi community.";
            } else {
                subscriber.setActive(true);
                subscriber.setUnsubscribedAt(null);
                subscriber.setSource(request.source() != null ? request.source() : subscriber.getSource());
                subscriber = subscriberRepository.save(subscriber);
                message = "Welcome back! Use code " + WELCOME_COUPON_CODE + " for 10% off your next piece.";
            }
        } else {
            subscriber = new NewsletterSubscriber(normalizedEmail, request.source());
            subscriber = subscriberRepository.save(subscriber);
            log.info("New newsletter subscriber registered: email={}", normalizedEmail);
            message = "Welcome to Odessi. Enjoy 10% off your first order with code " + WELCOME_COUPON_CODE + ".";
        }

        return new NewsletterResponse(
                subscriber.getId(),
                subscriber.getEmail(),
                subscriber.isActive(),
                subscriber.getSource(),
                WELCOME_COUPON_CODE,
                message,
                subscriber.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public void unsubscribe(String email) {
        String normalizedEmail = email.trim().toLowerCase();
        subscriberRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(sub -> {
            sub.setActive(false);
            sub.setUnsubscribedAt(Instant.now());
            subscriberRepository.save(sub);
            log.info("Newsletter subscriber unsubscribed: email={}", normalizedEmail);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<NewsletterResponse> getAllSubscribers() {
        return subscriberRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(sub -> new NewsletterResponse(
                        sub.getId(),
                        sub.getEmail(),
                        sub.isActive(),
                        sub.getSource(),
                        WELCOME_COUPON_CODE,
                        sub.isActive() ? "Active subscriber" : "Unsubscribed",
                        sub.getCreatedAt()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getActiveSubscriberCount() {
        return subscriberRepository.countByActiveTrue();
    }
}
