# App de Actas

App móvil para grabar, transcribir y resumir reuniones de junta directiva de iglesia,
generando un acta compartible por cualquier canal.

Ver `CLAUDE.md` para el contexto completo del proyecto (stack, decisiones, sprint actual).

## Estructura del repositorio

```
actas-app/
├── backend/     → API en Java + Spring Boot
├── frontend/    → App móvil en React (Expo)
└── docs/        → Documentación, ADRs y backlog
```

## Arrancar el backend

```bash
cd backend
./mvnw spring-boot:run
```

Requiere un archivo `.env` o variables de entorno con las credenciales de Supabase
(ver `backend/src/main/resources/application.yml` para las claves esperadas).

## Arrancar el frontend

```bash
cd frontend
npm install
npx expo start
```
