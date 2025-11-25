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

# Expose the port 80, since we will override to this port
EXPOSE 80

# Set environment variable to override Spring Boot server port to 80
ENV SERVER_PORT=80

ENV SPRING_DATASOURCE_URL='jdbc:postgresql://dpg-d38q7j7fte5s73canqjg-a:5432/fund_smith_postgres?sslmode=require'
ENV SPRING_DATASOURCE_USERNAME=fund_smith_postgres_user
ENV SPRING_DATASOURCE_PASSWORD=w3A3gwvbcHGc8mHJQO5Fu40D50k5crp5
ENV SERVER_PORT=80

# Run the app
ENTRYPOINT ["java", "-Xmx512m", "-Xms256m", "-jar", "app.jar"]
