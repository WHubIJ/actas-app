# No hay Maven wrapper en el repo (ver CLAUDE.md raíz) — se compila con una
# imagen de Maven, no con ./mvnw.
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render asigna el puerto real vía $PORT; application.yml ya lo lee
# (server.port: ${PORT:8080}).
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
