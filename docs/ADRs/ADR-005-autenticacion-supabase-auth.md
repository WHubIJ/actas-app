# ADR-005: Autenticación vía Supabase Auth (sustituye la decisión de auth de ADR-001)

**Sprint**: 1 (antes de fusionar `feat/backend-autenticacion`)
**Estado**: Aceptado
**Propietario**: Wisdom Imade Isibor

---

## Contexto

ADR-001 decidió "autenticación propia en Spring Boot (no Supabase Auth)", pero
a diferencia de storage y generación de archivos, esa elección se declaró sin
alternativas consideradas ni justificación escrita — fue un default, no una
decisión razonada.

Desde entonces:

- Ya existe una implementación parcial de autenticación propia en la rama
  `feat/backend-autenticacion` (`Usuario` JPA, `AutenticacionController`,
  `JwtGeneradorTokenAdapter`, hashing con BCrypt, endpoints de registro/login),
  sin fusionar a `feat/ui-diseno-figma`.
- El frontend ya usa el cliente `@supabase/supabase-js` (`supabaseClient.ts`)
  para Storage, así que añadir Supabase Auth no introduce una dependencia nueva.
- ADR-003 ya dejó constancia explícita de que descartaba RLS de Supabase para
  multi-tenancy "por ahora", precisamente porque dependía de `auth.uid()` de
  Supabase Auth, y decía literalmente: *"Se reevaluará si en el futuro se
  adopta Supabase Auth."* Ese futuro es ahora.

Reimplementar a mano lo que Supabase Auth ya resuelve (hashing seguro, emisión
y rotación de tokens, refresco de sesión, verificación de email, recuperación
de contraseña) no aporta nada que el proyecto necesite; no hay un requisito
que justifique mantener un authorization server propio.

## Decisión

- Sustituir la autenticación propia en Spring Boot por **Supabase Auth**.
- El backend deja de **emitir** JWT y pasa a **validarlos**: Spring Security se
  configura como resource server, verificando los JWT que emite Supabase Auth
  (JWKS/secreto compartido) en vez de generarlos con `JwtGeneradorTokenAdapter`.
- El identificador de usuario de referencia en el dominio (`membresia`,
  `miembro_equipo`, etc. de ADR-003) pasa a ser el `auth.users.id` (UUID) que
  gestiona Supabase, no un id generado por una tabla `Usuario` propia.
- El trabajo de la rama `feat/backend-autenticacion` (`Usuario`,
  `AutenticacionController`, JWT/BCrypt propios) no se fusiona tal cual; qué
  hacer exactamente con esa rama (descartar, archivar como referencia,
  reaprovechar parte del código) queda pendiente de decidir por separado.

## Alternativas consideradas

- **Mantener autenticación propia en Spring Boot** (statu quo de ADR-001):
  descartado — duplica esfuerzo en un problema ya resuelto de forma probada
  por Supabase, sin ninguna ventaja concreta para este proyecto.
- **Híbrido: identidad en Supabase Auth, autorización por rol en Spring Boot**:
  no descartado, pero fuera de alcance de este ADR. La lógica de permisos por
  rol (`OWNER`/`ADMIN`/`MIEMBRO`, `LIDER`/`MIEMBRO`) ya estaba pendiente de un
  ADR posterior según ADR-003, independientemente de quién gestione la
  identidad.

## Consecuencias

- ADR-001 queda desactualizado en su sección de Autenticación; se marca como
  sustituida por este ADR.
- El módulo de cuentas previsto en ADR-003 (`organizacion`/`equipo`/
  `membresia`) se apoya en `auth.users.id` de Supabase en vez de una tabla
  `Usuario` propia.
- `SecurityConfig` cambia de emitir/validar JWT propios a configurarse como
  resource server frente a Supabase; el `permitAll()` provisional documentado
  en `backend/CLAUDE.md` sigue vigente hasta implementar este cambio.
- El frontend gana un flujo de login/registro nativo de Supabase
  (`supabase.auth.signUp` / `signInWithPassword`, gestión de sesión) en vez de
  llamar a endpoints propios de `/api/auth/*`.
- Reabre, sin resolverla aquí, la alternativa de ADR-003 de usar RLS de
  Postgres vía `auth.uid()` para multi-tenancy en vez de filtrado a nivel de
  aplicación — queda como decisión pendiente para un ADR futuro.
- `docs/01-Domain/modelo.md`, ya desactualizado por ADR-003, sigue pendiente
  de reflejar también este cambio de modelo de usuario.
- Detalles de implementación (qué hacer con `feat/backend-autenticacion`, forma
  exacta de validar el JWT en Spring Security, cambios en las migraciones
  Flyway para vincular `membresia` a `auth.users`) se resuelven aparte, no en
  este ADR.
