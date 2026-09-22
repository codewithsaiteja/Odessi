package com.odessi.api.service;

import com.odessi.api.dto.newsletter.NewsletterResponse;
import com.odessi.api.dto.newsletter.NewsletterSubscribeRequest;

import java.util.List;

public interface NewsletterService {

    NewsletterResponse subscribe(NewsletterSubscribeRequest request);

    void unsubscribe(String email);

    List<NewsletterResponse> getAllSubscribers();

    long getActiveSubscriberCount();
}
