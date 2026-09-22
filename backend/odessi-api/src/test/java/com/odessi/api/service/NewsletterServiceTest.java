package com.odessi.api.service;

import com.odessi.api.dto.newsletter.NewsletterResponse;
import com.odessi.api.dto.newsletter.NewsletterSubscribeRequest;
import com.odessi.api.entity.NewsletterSubscriber;
import com.odessi.api.repository.NewsletterSubscriberRepository;
import com.odessi.api.service.impl.NewsletterServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NewsletterServiceTest {

    @Mock
    private NewsletterSubscriberRepository subscriberRepository;

    private NewsletterServiceImpl newsletterService;

    @BeforeEach
    void setUp() {
        newsletterService = new NewsletterServiceImpl(subscriberRepository);
    }

    @Test
    @DisplayName("New subscriber registers and receives WELCOME10 coupon")
    void subscribe_newEmail_success() {
        NewsletterSubscribeRequest request = new NewsletterSubscribeRequest("shopper@example.com", "HOMEPAGE");

        when(subscriberRepository.findByEmailIgnoreCase("shopper@example.com")).thenReturn(Optional.empty());
        when(subscriberRepository.save(any(NewsletterSubscriber.class))).thenAnswer(invocation -> {
            NewsletterSubscriber sub = invocation.getArgument(0);
            sub.setId(100L);
            sub.setCreatedAt(Instant.now());
            return sub;
        });

        NewsletterResponse response = newsletterService.subscribe(request);

        assertThat(response).isNotNull();
        assertThat(response.email()).isEqualTo("shopper@example.com");
        assertThat(response.couponCode()).isEqualTo("WELCOME10");
        assertThat(response.active()).isTrue();
        verify(subscriberRepository, times(1)).save(any(NewsletterSubscriber.class));
    }

    @Test
    @DisplayName("Existing active subscriber receives already subscribed message without duplicate entry")
    void subscribe_existingActive_returnsCurrent() {
        NewsletterSubscribeRequest request = new NewsletterSubscribeRequest("shopper@example.com", "HOMEPAGE");

        NewsletterSubscriber existing = new NewsletterSubscriber("shopper@example.com", "STOREFRONT_FOOTER");
        existing.setId(100L);
        existing.setActive(true);

        when(subscriberRepository.findByEmailIgnoreCase("shopper@example.com")).thenReturn(Optional.of(existing));

        NewsletterResponse response = newsletterService.subscribe(request);

        assertThat(response.email()).isEqualTo("shopper@example.com");
        assertThat(response.message()).contains("already part of the Odessi community");
        verify(subscriberRepository, never()).save(any(NewsletterSubscriber.class));
    }

    @Test
    @DisplayName("Unsubscribing marks subscriber inactive")
    void unsubscribe_marksInactive() {
        NewsletterSubscriber existing = new NewsletterSubscriber("shopper@example.com", "STOREFRONT_FOOTER");
        existing.setActive(true);

        when(subscriberRepository.findByEmailIgnoreCase("shopper@example.com")).thenReturn(Optional.of(existing));

        newsletterService.unsubscribe("shopper@example.com");

        assertThat(existing.isActive()).isFalse();
        assertThat(existing.getUnsubscribedAt()).isNotNull();
        verify(subscriberRepository, times(1)).save(existing);
    }
}
