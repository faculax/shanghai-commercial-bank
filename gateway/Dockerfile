# ---------- Stage 1: Build ----------
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy only what's needed to cache dependencies
COPY pom.xml .
COPY src ./src

# Build the app (creates the JAR)
RUN mvn clean package -DskipTests

# ---------- Stage 2: Runtime ----------
FROM eclipse-temurin:21-jre-alpine

# Set working directory
WORKDIR /app

# Copy the built JAR from the previous stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the port 8081, which matches the application.yml config
EXPOSE 8081

# Set environment variables for service connectivity
# SERVER_PORT is not set to use the default from application.yml
ENV MARKET_DATA_URI=http://backend:8080
ENV BACKEND_URI=https://fund-smith-backend.onrender.com

# Run the app
ENTRYPOINT ["java", "-Xmx512m", "-Xms256m", "-jar", "app.jar"]
