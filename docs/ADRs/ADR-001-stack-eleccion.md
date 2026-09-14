# ADR-001: Elección de stack técnico

**Sprint**: 1
**Estado**: Aceptado
**Propietario**: Wisdom Imade Isibor

---

## Contexto

Se necesita definir el stack técnico para la App de Actas: una app móvil que graba
reuniones de junta directiva de iglesia, las transcribe, genera un resumen con IA,
y permite compartir el acta resultante por cualquier canal.

Se evaluaron varias combinaciones de backend, base de datos, storage y frontend,
así como el flujo de generación y envío de archivos.

## Decisión

- **Backend:** Java + Spring Boot.
- **Base de datos:** Supabase (Postgres).
- **Storage de audios:** Supabase Storage.
- **Autenticación:** implementación propia en Spring Boot (no Supabase Auth).
- **Frontend:** React, como app móvil nativa/híbrida.
- **Transcripción y resumen:** API externa (Whisper / OpenAI), invocada desde el backend.
- **Generación de archivos:** el backend genera los archivos (no el frontend).
  - Transcripción: solo en PDF.
  - Resumen: en PDF, Word o Markdown, a elección del usuario.
- **Compartir:** la app descarga el archivo generado y usa el share sheet nativo
  del sistema operativo (cubre WhatsApp, Gmail, Telegram, etc. sin integraciones
  individuales), con opción adicional de compartir un enlace hosted.

## Alternativas consideradas

**Storage: AWS S3 en vez de Supabase Storage**
Se consideró usar S3, con dos variantes de subida:
- Subida vía backend (más control y validación, pero el archivo viaja dos veces
  y el backend absorbe la carga).
- Subida directa desde el frontend con URLs firmadas (más eficiente, pero exige
  configurar CORS, políticas IAM, y renuncia a validar el archivo del lado servidor).

Se descartó en favor de Supabase Storage porque mantiene todo (BD + storage) en una
sola plataforma, reduce la superficie de configuración (RLS en vez de IAM), y
Supabase soporta subida directa desde el frontend de forma nativa sin montar
presigned URLs a mano. Para el volumen esperado (pocas reuniones al mes por iglesia),
la simplicidad pesa más que la escalabilidad adicional de S3.

**Generación de archivos: en el frontend en vez del backend**
Se descartó porque generar PDF/Word con buena calidad desde un entorno móvil
tiene peor soporte de librerías que en Java, y duplicaría la lógica de formato
si en el futuro se añaden más plataformas.

## Consecuencias

- Se reutilizan patrones y conocimiento ya adquiridos en IPUE Management System
  (mismo lenguaje y framework de backend).
- La validación de archivos subidos a Supabase Storage ocurre en el frontend,
  no en el backend; es una validación de UX, no una barrera de seguridad real.
- El backend necesita librerías Java para generación de documentos
  (ej. iText/OpenPDF para PDF, Apache POI para Word).
- El proyecto no comparte infraestructura con la app de gestión de datos del
  chiringuito/iglesia; cualquier cambio de stack en un proyecto no afecta al otro.
