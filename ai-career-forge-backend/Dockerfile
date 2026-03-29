# ----- Stage 1: Build -----
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Maven files
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies (caching layer)
RUN ./mvnw dependency:go-offline

# Copy source and build
COPY src src
RUN ./mvnw package -DskipTests

# ----- Stage 2: Run -----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built jar
COPY --from=build /app/target/*.jar app.jar

# JVM arguments for MongoDB reflections
ENTRYPOINT ["java", \
    "--add-opens", "java.base/java.lang=ALL-UNNAMED", \
    "--add-opens", "java.base/java.util=ALL-UNNAMED", \
    "--add-opens", "java.base/java.lang.reflect=ALL-UNNAMED", \
    "--add-opens", "java.base/java.text=ALL-UNNAMED", \
    "--add-opens", "java.base/java.nio.charset=ALL-UNNAMED", \
    "-jar", "app.jar"]
