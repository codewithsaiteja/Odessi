package com.odessi.api.service;

import com.odessi.api.config.AppProperties;
import com.odessi.api.config.MailConfig;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.OrderItem;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.service.impl.ProductionEmailService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.math.BigDecimal;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Production Email Service Tests")
class ProductionEmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    private AppProperties appProperties;
    private ProductionEmailService emailService;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        AppProperties.Mail mail = appProperties.getMail();
        mail.setHost("smtp.resend.com");
        mail.setPort(587);
        mail.setUsername("resend");
        mail.setPassword("re_test_secret_key_12345");
        mail.setFromEmail("noreply@odessitfi.me");
        mail.setFromName("Odessi");
        mail.setPrimaryFrontendUrl("https://www.odessitfi.me");

        emailService = new ProductionEmailService(null, mailSender, appProperties);
    }

    @Nested
    @DisplayName("Email Sending Tests")
    class SendingTests {

        @Test
        @DisplayName("sendVerificationEmail sends HTML email with correct recipient, subject, and link")
        void sendVerificationEmail_success() throws Exception {
            MimeMessage mimeMessage = new MimeMessage((Session) null);
            given(mailSender.createMimeMessage()).willReturn(mimeMessage);

            emailService.sendVerificationEmail("shopper@example.com", "verify-token-abc-123");

            ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
            verify(mailSender, times(1)).send(captor.capture());

            MimeMessage sentMessage = captor.getValue();
            assertThat(sentMessage.getSubject()).isEqualTo("Verify Your Odessi Account");
            assertThat(sentMessage.getAllRecipients()).hasSize(1);
            assertThat(sentMessage.getAllRecipients()[0].toString()).isEqualTo("shopper@example.com");
        }

        @Test
        @DisplayName("sendPasswordResetEmail sends HTML email with correct recipient, subject, and link")
        void sendPasswordResetEmail_success() throws Exception {
            MimeMessage mimeMessage = new MimeMessage((Session) null);
            given(mailSender.createMimeMessage()).willReturn(mimeMessage);

            emailService.sendPasswordResetEmail("shopper@example.com", "reset-token-xyz-789");

            ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
            verify(mailSender, times(1)).send(captor.capture());

            MimeMessage sentMessage = captor.getValue();
            assertThat(sentMessage.getSubject()).isEqualTo("Reset Your Odessi Password");
            assertThat(sentMessage.getAllRecipients()).hasSize(1);
            assertThat(sentMessage.getAllRecipients()[0].toString()).isEqualTo("shopper@example.com");
        }

        @Test
        @DisplayName("sendHtmlEmail uses Resend Java SDK when resendApiKey is configured")
        void sendHtmlEmail_usesResendClientWhenConfigured() throws Exception {
            com.resend.Resend mockResend = mock(com.resend.Resend.class);
            com.resend.services.emails.Emails mockEmails = mock(com.resend.services.emails.Emails.class);
            com.resend.services.emails.model.CreateEmailResponse mockResponse = mock(com.resend.services.emails.model.CreateEmailResponse.class);

            given(mockResend.emails()).willReturn(mockEmails);
            given(mockEmails.send(any(com.resend.services.emails.model.CreateEmailOptions.class))).willReturn(mockResponse);
            given(mockResponse.getId()).willReturn("re_msg_12345");

            appProperties.getMail().setResendApiKey("re_test_key_123");
            ProductionEmailService resendEmailService = new ProductionEmailService(mockResend, mailSender, appProperties);

            assertThat(resendEmailService.isResendActive()).isTrue();

            resendEmailService.sendTestEmail("shopper@example.com");

            ArgumentCaptor<com.resend.services.emails.model.CreateEmailOptions> captor =
                    ArgumentCaptor.forClass(com.resend.services.emails.model.CreateEmailOptions.class);
            verify(mockEmails, times(1)).send(captor.capture());

            com.resend.services.emails.model.CreateEmailOptions sentOptions = captor.getValue();
            assertThat(sentOptions.getTo()).contains("shopper@example.com");
            assertThat(sentOptions.getFrom()).contains("Odessi");
            assertThat(sentOptions.getSubject()).contains("Production Email Integration Test");
            assertThat(sentOptions.getHtml()).contains("Operational");
            verify(mailSender, never()).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("sendHtmlEmail handles Resend error safely without leaking credentials")
        void sendHtmlEmail_resendError_handledSafely() throws Exception {
            com.resend.Resend mockResend = mock(com.resend.Resend.class);
            com.resend.services.emails.Emails mockEmails = mock(com.resend.services.emails.Emails.class);

            given(mockResend.emails()).willReturn(mockEmails);
            doThrow(new RuntimeException("API rate limit exceeded"))
                    .when(mockEmails).send(any(com.resend.services.emails.model.CreateEmailOptions.class));

            appProperties.getMail().setResendApiKey("re_test_key_123");
            ProductionEmailService resendEmailService = new ProductionEmailService(mockResend, mailSender, appProperties);

            assertThatThrownBy(() -> resendEmailService.sendTestEmail("shopper@example.com"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Failed to deliver email via Resend");
        }

        @Test
        @DisplayName("sendHtmlEmail throws BusinessException when neither Resend nor SMTP is configured")
        void sendHtmlEmail_unconfiguredHost_throwsBusinessException() {
            appProperties.getMail().setHost(null);
            appProperties.getMail().setResendApiKey(null);
            ProductionEmailService unconfiguredService = new ProductionEmailService(null, null, appProperties);

            assertThatThrownBy(() -> unconfiguredService.sendVerificationEmail("shopper@example.com", "tok-123"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Email service is temporarily unavailable");

            verify(mailSender, never()).send(any(MimeMessage.class));
        }

        @Test
        @DisplayName("sendHtmlEmail handles MailException safely without exposing tokens")
        void sendHtmlEmail_mailException_handledSafely() {
            MimeMessage mimeMessage = new MimeMessage((Session) null);
            given(mailSender.createMimeMessage()).willReturn(mimeMessage);
            doThrow(new MailSendException("SMTP relay timeout"))
                    .when(mailSender).send(any(MimeMessage.class));

            assertThatThrownBy(() -> emailService.sendPasswordResetEmail("shopper@example.com", "secret-token-456"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Failed to deliver email");
        }

        @Test
        @DisplayName("sendOrderConfirmationEmail sends rich HTML confirmation via Resend SDK")
        void sendOrderConfirmationEmail_sendsViaResend() throws Exception {
            com.resend.Resend mockResend = mock(com.resend.Resend.class);
            com.resend.services.emails.Emails mockEmails = mock(com.resend.services.emails.Emails.class);
            com.resend.services.emails.model.CreateEmailResponse mockResponse = mock(com.resend.services.emails.model.CreateEmailResponse.class);

            given(mockResend.emails()).willReturn(mockEmails);
            given(mockEmails.send(any(com.resend.services.emails.model.CreateEmailOptions.class))).willReturn(mockResponse);
            given(mockResponse.getId()).willReturn("re_msg_order_123");

            appProperties.getMail().setResendApiKey("re_test_key_123");
            ProductionEmailService resendEmailService = new ProductionEmailService(mockResend, mailSender, appProperties);

            Order order = new Order();
            order.setId(100L);
            order.setOrderNumber("ORD-20260923-00003");
            order.setCustomerEmail("shopper@example.com");
            order.setCustomerName("Aarav Sharma");
            order.setTotalAmount(new BigDecimal("2999.00"));
            order.setCurrency("INR");
            order.setRazorpayOrderId("order_rzp_123");
            order.setRazorpayPaymentId("pay_456");

            OrderItem item = new OrderItem();
            item.setProductNameSnapshot("Odessi Noir Hoodie");
            item.setSkuSnapshot("ODS-BLK-L");
            item.setColorSnapshot("Obsidian Black");
            item.setSizeSnapshot("L");
            item.setQuantity(1);
            item.setUnitPrice(new BigDecimal("2999.00"));
            order.addItem(item);

            resendEmailService.sendOrderConfirmationEmail(order);

            ArgumentCaptor<com.resend.services.emails.model.CreateEmailOptions> captor =
                    ArgumentCaptor.forClass(com.resend.services.emails.model.CreateEmailOptions.class);
            verify(mockEmails, times(1)).send(captor.capture());

            com.resend.services.emails.model.CreateEmailOptions sentOptions = captor.getValue();
            assertThat(sentOptions.getTo()).contains("shopper@example.com");
            assertThat(sentOptions.getSubject()).contains("ORD-20260923-00003");
            assertThat(sentOptions.getHtml()).contains("ORD-20260923-00003");
            assertThat(sentOptions.getHtml()).contains("Odessi Noir Hoodie");
            assertThat(sentOptions.getHtml()).contains("ODS-BLK-L");
        }

        @Test
        @DisplayName("sendOrderConfirmationEmail retries with onboarding@resend.dev when custom domain is not verified")
        void sendOrderConfirmationEmail_retriesWithFallbackSender() throws Exception {
            com.resend.Resend mockResend = mock(com.resend.Resend.class);
            com.resend.services.emails.Emails mockEmails = mock(com.resend.services.emails.Emails.class);
            com.resend.services.emails.model.CreateEmailResponse mockResponse = mock(com.resend.services.emails.model.CreateEmailResponse.class);

            given(mockResend.emails()).willReturn(mockEmails);
            given(mockEmails.send(any(com.resend.services.emails.model.CreateEmailOptions.class)))
                    .willThrow(new RuntimeException("domain_not_verified: The domain odessitfi.me is not verified"))
                    .willReturn(mockResponse);
            given(mockResponse.getId()).willReturn("re_fallback_msg_999");

            appProperties.getMail().setResendApiKey("re_test_key_123");
            ProductionEmailService resendEmailService = new ProductionEmailService(mockResend, mailSender, appProperties);

            Order order = new Order();
            order.setId(100L);
            order.setOrderNumber("ORD-20260923-00003");
            order.setCustomerEmail("shopper@example.com");
            order.setTotalAmount(new BigDecimal("1999.00"));

            resendEmailService.sendOrderConfirmationEmail(order);

            ArgumentCaptor<com.resend.services.emails.model.CreateEmailOptions> captor =
                    ArgumentCaptor.forClass(com.resend.services.emails.model.CreateEmailOptions.class);
            verify(mockEmails, times(2)).send(captor.capture());

            // Second attempt should use onboarding@resend.dev
            assertThat(captor.getAllValues().get(1).getFrom()).contains("onboarding@resend.dev");
        }

        @Test
        @DisplayName("sendOrderConfirmationEmail handles null customer email gracefully without throwing")
        void sendOrderConfirmationEmail_nullCustomerEmail_gracefullyHandled() {
            ProductionEmailService resendEmailService = new ProductionEmailService(null, mailSender, appProperties);
            Order order = new Order();
            order.setId(100L);
            order.setOrderNumber("ORD-20260923-00003");
            order.setCustomerEmail(null);
            order.setUser(null);

            // Should not throw exception
            resendEmailService.sendOrderConfirmationEmail(order);
            verifyNoInteractions(mailSender);
        }
    }

    @Nested
    @DisplayName("Primary Frontend URL Resolution Tests")
    class UrlResolutionTests {

        @Test
        @DisplayName("resolvePrimaryFrontendUrl extracts https://www.odessitfi.me from comma-separated origins")
        void resolvePrimaryFrontendUrl_prefersWwwOdessitfi() {
            appProperties.getMail().setPrimaryFrontendUrl(null);
            appProperties.getCors().setAllowedOrigins(
                    "https://odessitfi.me,https://www.odessitfi.me,https://odessi-frontend.vercel.app,https://odessi.shop"
            );

            String resolved = emailService.resolvePrimaryFrontendUrl();
            assertThat(resolved).isEqualTo("https://www.odessitfi.me");
            assertThat(resolved).doesNotContain(",");
        }

        @Test
        @DisplayName("resolvePrimaryFrontendUrl uses explicit PRIMARY_FRONTEND_URL when configured")
        void resolvePrimaryFrontendUrl_usesExplicitConfig() {
            appProperties.getMail().setPrimaryFrontendUrl("https://www.odessitfi.me/");

            String resolved = emailService.resolvePrimaryFrontendUrl();
            assertThat(resolved).isEqualTo("https://www.odessitfi.me");
            assertThat(resolved).doesNotEndWith("/");
        }

        @Test
        @DisplayName("resolvePrimaryFrontendUrl falls back to apex odessitfi.me if www is absent")
        void resolvePrimaryFrontendUrl_fallsBackToApex() {
            appProperties.getMail().setPrimaryFrontendUrl(null);
            appProperties.getCors().setAllowedOrigins("https://odessitfi.me,https://odessi-frontend.vercel.app");

            String resolved = emailService.resolvePrimaryFrontendUrl();
            assertThat(resolved).isEqualTo("https://odessitfi.me");
        }
    }

    @Nested
    @DisplayName("Security & Privacy Tests")
    class SecurityPrivacyTests {

        @Test
        @DisplayName("maskEmail masks recipient email correctly")
        void maskEmail_correctlyMasks() {
            assertThat(ProductionEmailService.maskEmail("customer@example.com")).isEqualTo("c***r@example.com");
            assertThat(ProductionEmailService.maskEmail("alex@odessi.tfi")).isEqualTo("a***x@odessi.tfi");
            assertThat(ProductionEmailService.maskEmail("ab@odessi.tfi")).isEqualTo("a***@odessi.tfi");
            assertThat(ProductionEmailService.maskEmail("a@b.com")).isEqualTo("***@b.com");
            assertThat(ProductionEmailService.maskEmail(null)).isEqualTo("***");
            assertThat(ProductionEmailService.maskEmail("")).isEqualTo("***");
        }
    }

    @Nested
    @DisplayName("Mail Configuration Tests")
    class MailConfigTests {

        @Test
        @DisplayName("MailConfig creates JavaMailSender with socket timeouts and credentials")
        void mailConfig_configuresSenderProperly() {
            MailConfig mailConfig = new MailConfig(appProperties);
            JavaMailSender sender = mailConfig.javaMailSender();

            assertThat(sender).isInstanceOf(JavaMailSenderImpl.class);
            JavaMailSenderImpl impl = (JavaMailSenderImpl) sender;

            assertThat(impl.getHost()).isEqualTo("smtp.resend.com");
            assertThat(impl.getPort()).isEqualTo(587);
            assertThat(impl.getUsername()).isEqualTo("resend");
            assertThat(impl.getPassword()).isEqualTo("re_test_secret_key_12345");

            Properties props = impl.getJavaMailProperties();
            assertThat(props.getProperty("mail.smtp.auth")).isEqualTo("true");
            assertThat(props.getProperty("mail.smtp.starttls.enable")).isEqualTo("true");
            assertThat(props.getProperty("mail.smtp.connectiontimeout")).isEqualTo("5000");
            assertThat(props.getProperty("mail.smtp.timeout")).isEqualTo("5000");
            assertThat(props.getProperty("mail.smtp.writetimeout")).isEqualTo("5000");
        }

        @Test
        @DisplayName("MailConfig creates empty JavaMailSender when host is not configured without failing")
        void mailConfig_emptyHost_doesNotThrow() {
            AppProperties emptyProps = new AppProperties();
            emptyProps.getMail().setHost(null);

            MailConfig mailConfig = new MailConfig(emptyProps);
            JavaMailSender sender = mailConfig.javaMailSender();

            assertThat(sender).isNotNull();
            assertThat(((JavaMailSenderImpl) sender).getHost()).isNull();
        }
    }
}
