# Build Stage
FROM maven:3.9.5-eclipse-temurin-17 AS build
WORKDIR /app

# Copy the pom.xml and download dependencies (cache layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy the source code and build the application
COPY src ./src
# Tests are expected to be run via GitHub Actions or locally before building
RUN mvn clean package -DskipTests -B

# Run Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add a non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the jar file from the build stage
COPY --from=build /app/target/odessi-api-0.0.1-SNAPSHOT.jar app.jar

# Expose internal port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
