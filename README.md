# MeetingAI (actas-app)

App móvil para grabar, transcribir y resumir reuniones de junta directiva u otros
órganos de gobierno, generando un acta compartible por cualquier canal (WhatsApp,
Gmail, Telegram, etc.). Cualquier organización con reuniones periódicas es cliente
potencial (iglesias, asociaciones, ONGs, cooperativas, pequeñas empresas); iglesias
es el vertical piloto, no el único (ver ADR-003).

**Estado:** MVP en desarrollo activo (Sprint 1), no un producto terminado —
autenticación completa y permisos por rol todavía no están implementados.

Ver `CLAUDE.md` para el contexto completo del proyecto (stack, decisiones, sprint
actual) y `docs/ADRs/` para las decisiones técnicas con su contexto y alternativas
descartadas.

## Estructura del repositorio

```
actas-app/
├── backend/     → API en Java + Spring Boot (arquitectura hexagonal + modular monolito, ver ADR-002)
├── frontend/    → App móvil en React Native + Expo
└── docs/        → Documentación, ADRs y backlog
```

## Arrancar el backend

No hay Maven wrapper en el repo: usar el `mvn` del sistema.

```bash
cd backend
mvn spring-boot:run
```

Arranca en el puerto 8080 por defecto. Requiere un archivo `.env` (o
`application-local.yml`, ambos ignorados por git) o variables de entorno con las
credenciales de Supabase y la API key de Mistral — ver
`backend/src/main/resources/application.yml` para las claves esperadas.

## Arrancar el frontend

```bash
cd frontend
npm install
npx expo start
```

Requiere `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL` y
`EXPO_PUBLIC_SUPABASE_ANON_KEY` en `frontend/.env` (ignorado por git) — sin ellas,
las pantallas que dependen del backend fallan con un error explícito en vez de
simular un éxito.
