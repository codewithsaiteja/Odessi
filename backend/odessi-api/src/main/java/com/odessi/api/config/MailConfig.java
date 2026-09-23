package com.odessi.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Mail configuration for Odessi.tfi backend.
 *
 * <p>Provides a {@link JavaMailSender} configured from {@link AppProperties#getMail()}.
 * Supports standard SMTP providers (Resend, Brevo, SendGrid, AWS SES, Gmail, Mailgun, Postmark).
 * Strict 5-second socket connection, read, and write timeouts are enforced to prevent
 * external mail servers from blocking request threads.
 */
@Configuration
public class MailConfig {

    private final AppProperties appProperties;

    public MailConfig(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        AppProperties.Mail mailProps = appProperties.getMail();

        mailSender.setDefaultEncoding("UTF-8");

        if (mailProps.getHost() != null && !mailProps.getHost().isBlank()) {
            mailSender.setHost(mailProps.getHost().trim());
            mailSender.setPort(mailProps.getPort());

            if (mailProps.getUsername() != null && !mailProps.getUsername().isBlank()) {
                mailSender.setUsername(mailProps.getUsername().trim());
            }
            if (mailProps.getPassword() != null && !mailProps.getPassword().isBlank()) {
                mailSender.setPassword(mailProps.getPassword().trim());
            }

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", String.valueOf(mailProps.isAuth()));
            props.put("mail.smtp.starttls.enable", String.valueOf(mailProps.isStarttls()));
            props.put("mail.smtp.starttls.required", String.valueOf(mailProps.isStarttls()));

            // Socket & network timeouts (in milliseconds)
            props.put("mail.smtp.connectiontimeout", String.valueOf(mailProps.getConnectionTimeout()));
            props.put("mail.smtp.timeout", String.valueOf(mailProps.getReadTimeout()));
            props.put("mail.smtp.writetimeout", String.valueOf(mailProps.getWriteTimeout()));
        }

        return mailSender;
    }
}
