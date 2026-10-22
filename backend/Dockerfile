# No hay Maven wrapper en el repo (ver CLAUDE.md raíz) — se compila con una
# imagen de Maven, no con ./mvnw.
#
# Rutas de COPY con prefijo "backend/" a propósito: en Render, si se fija
# "Root Directory" para resolver el contexto, Dockerfile Path y contexto
# acaban desincronizados en el asistente manual (contexto vacío en el build).
# Para evitarlo, este Dockerfile asume contexto = raíz del repo (monorepo),
# con "Dockerfile Path" = backend/Dockerfile y sin "Root Directory".
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY backend/pom.xml .
RUN mvn -B dependency:go-offline
COPY backend/src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render asigna el puerto real vía $PORT; application.yml ya lo lee
# (server.port: ${PORT:8080}).
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
