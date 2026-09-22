# ══════════════════════════════════════════════════════════════
# Multi-stage Dockerfile for Spring Boot Backend
# ══════════════════════════════════════════════════════════════

# Build stage
FROM maven:3.9.11-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy Maven configuration and download dependencies (cache layer)
COPY odessi-api/pom.xml .
RUN mvn dependency:go-offline -B

COPY odessi-api/src ./src

# Build the application
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine AS runtime

# Install curl for health checks
RUN apk add --no-cache curl

# Create app user and prepare upload directories
RUN addgroup -S odessi && adduser -S odessi -G odessi && \
    mkdir -p /app/uploads/products /app/uploads/social && \
    chown -R odessi:odessi /app

# Set working directory
WORKDIR /app

# Copy the built jar file
COPY --from=build --chown=odessi:odessi /app/target/*.jar app.jar

# Switch to non-root user
USER odessi

# Expose port (Render sets $PORT dynamically, default 10000)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-10000}/actuator/health || exit 1

# Run the application binding to dynamic PORT and 0.0.0.0
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-10000} -Dserver.address=0.0.0.0 -jar app.jar"]