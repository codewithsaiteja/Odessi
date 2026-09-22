# ══════════════════════════════════════════════════════════════
# Multi-stage Dockerfile for Spring Boot Backend
# ══════════════════════════════════════════════════════════════

# Build stage
FROM maven:3.9.6-openjdk-21-slim AS build
WORKDIR /app

# Copy Maven configuration
COPY odessi-api/pom.xml .
COPY odessi-api/src ./src

# Build the application
RUN mvn clean package -DskipTests

# Runtime stage
FROM openjdk:21-jre-slim AS runtime

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r odessi && useradd -r -g odessi odessi

# Set working directory
WORKDIR /app

# Copy the built jar file
COPY --from=build /app/target/*.jar app.jar

# Change ownership
RUN chown odessi:odessi app.jar

# Switch to non-root user
USER odessi

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]