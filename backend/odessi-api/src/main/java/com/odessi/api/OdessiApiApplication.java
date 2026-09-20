package com.odessi.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * ODESSI.TFI — Spring Boot Application Entry Point
 */
@SpringBootApplication
@EnableScheduling
public class OdessiApiApplication {

    public static void main(String[] args) {
        loadDotEnv();
        SpringApplication.run(OdessiApiApplication.class, args);
    }

    private static void loadDotEnv() {
        java.io.File envFile = new java.io.File(".env");
        if (envFile.exists() && envFile.isFile()) {
            try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(envFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) continue;
                    int eq = line.indexOf('=');
                    String key = line.substring(0, eq).trim();
                    String val = line.substring(eq + 1).trim();
                    if (System.getProperty(key) == null && System.getenv(key) == null) {
                        System.setProperty(key, val);
                    }
                }
            } catch (Exception ignored) {}
        }
    }
}
