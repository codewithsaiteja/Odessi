# Build Stage
FROM maven:3.9.11-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy the pom.xml and download dependencies (cache layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the source code and build the application
COPY src ./src
# Tests are run during CI/pre-deployment validation
RUN mvn clean package -DskipTests -B

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Add a non-root user and prepare upload directories
RUN addgroup -S spring && adduser -S spring -G spring && \
    mkdir -p /app/uploads/products /app/uploads/social && \
    chown -R spring:spring /app

USER spring:spring

# Copy the jar file from the build stage
COPY --from=build --chown=spring:spring /app/target/*.jar app.jar

# Expose Render default port
EXPOSE 10000

# Run the application binding to dynamic PORT and 0.0.0.0
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-10000} -Dserver.address=0.0.0.0 -jar app.jar"]
