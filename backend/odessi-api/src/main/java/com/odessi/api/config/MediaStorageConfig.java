package com.odessi.api.config;

import com.odessi.api.service.MediaStorageService;
import com.odessi.api.service.impl.AzureBlobStorageServiceImpl;
import com.odessi.api.service.impl.LocalStorageServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import java.util.Arrays;

/**
 * Media storage selection configuration.
 *
 * <p><b>Production (Render)</b>: {@code AZURE_STORAGE_CONNECTION_STRING} must be set.
 * If not configured in a non-dev environment, the application will fail fast with a clear error.
 *
 * <p><b>Development</b>: Falls back to {@link LocalStorageServiceImpl} transparently.
 *
 * <p>This is the only location where the Azure connection string is read.
 * It is never forwarded to API responses or logs.
 */
@Configuration
public class MediaStorageConfig {

    private static final Logger log = LoggerFactory.getLogger(MediaStorageConfig.class);

    private final AppProperties appProperties;
    private final Environment environment;

    public MediaStorageConfig(AppProperties appProperties, Environment environment) {
        this.appProperties = appProperties;
        this.environment = environment;
    }

    @Bean
    @Primary
    public MediaStorageService mediaStorageService() {
        AppProperties.AzureStorage azureConfig = appProperties.getAzureStorage();
        boolean isDevOrTest = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("dev") || p.equalsIgnoreCase("test"));

        if (azureConfig.isConfigured()) {
            log.info("[MediaStorage] Azure Blob Storage active — container: {}",
                    azureConfig.getContainerName());
            return new AzureBlobStorageServiceImpl(
                    azureConfig.getConnectionString(),
                    azureConfig.getContainerName()
            );
        }

        if (isDevOrTest) {
            // Development / test: local filesystem fallback is acceptable
            log.warn("[MediaStorage] Azure Blob Storage is NOT configured. " +
                     "Falling back to LocalStorageServiceImpl for local development. " +
                     "This MUST NOT happen in production.");
            return new LocalStorageServiceImpl();
        }

        // Production without Azure configured: fail fast with a clear message
        throw new IllegalStateException(
            "[MediaStorage] CONFIGURATION ERROR: AZURE_STORAGE_CONNECTION_STRING is not set. " +
            "All production media must be stored in Azure Blob Storage. " +
            "Set AZURE_STORAGE_CONNECTION_STRING in the Render environment variables. " +
            "The Render local filesystem is NOT a valid persistent media store."
        );
    }
}
