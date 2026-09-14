# ADR-002: Arquitectura Hexagonal + Modular Monolito

**Sprint**: 1 (aplicado antes de implementar la Épica 1)
**Estado**: Aceptado
**Propietario**: Wisdom Imade Isibor

---

## Contexto

El backend tiene varias integraciones externas (Supabase Storage, Whisper/OpenAI,
Firebase Cloud Messaging, generación de PDF/Word) y una división natural en 4
módulos que ya coincide con las épicas del Sprint 1: grabación, transcripción,
resumen y compartir.

Se evaluaron varios estilos arquitectónicos: MVC/capas tradicional (usado en IPUE),
arquitectura hexagonal (Ports & Adapters), Onion, modular monolith, microservicios,
event-driven, CQRS y vertical slice.

## Decisión

- **Arquitectura hexagonal** dentro de cada módulo: el dominio (`domain/`) no
  depende de Spring, JPA ni de ninguna librería externa. Se comunica con el
  exterior a través de **puertos** (interfaces en `puertos/entrada` y
  `puertos/salida`) implementados por **adaptadores** (`adaptadores/entrada`,
  `adaptadores/salida`).
- **Modular monolito**: el backend sigue siendo un único desplegable, pero
  dividido internamente en 4 módulos con fronteras claras, uno por épica:
  `grabacion`, `transcripcion`, `resumen`, `compartir`, más un paquete `shared`
  para eventos y manejo de errores comunes.
- **Comunicación entre módulos vía eventos internos de Spring**
  (`ApplicationEventPublisher`), no llamadas directas. Ej: `grabacion` publica
  `ReunionFinalizadaEvent`, que `transcripcion` escucha para arrancar sin que
  `grabacion` conozca la existencia de `transcripcion`.

## Alternativas consideradas

- **MVC/capas tradicional** (como IPUE): descartado para este proyecto porque no
  aporta nada nuevo al portfolio (ya demostrado en IPUE) y mezclaría lógica de
  negocio con detalles técnicos de las múltiples integraciones externas.
- **Onion**: es funcionalmente equivalente a hexagonal para este caso; no se
  adopta como estilo distinto porque no aporta ninguna ventaja adicional.
- **Microservicios**: descartado por sobre-ingeniería. Resuelve problemas de
  escalado y equipos grandes que no existen en un proyecto de un solo
  desarrollador en fase de MVP.
- **CQRS**: descartado. Resuelve asimetrías de carga lectura/escritura que este
  proyecto no tiene.
- **Vertical Slice**: considerado como alternativa de organización de carpetas,
  pero se prefiere la separación por puertos/adaptadores de hexagonal, más
  adecuada dado el volumen de integraciones externas del proyecto.

## Consecuencias

- El desarrollo de la Épica 1 será más lento al principio: hay que definir
  puertos e interfaces antes de escribir lógica concreta. Es un coste aceptado
  conscientemente, dado el margen de tiempo disponible (objetivo: febrero/marzo)
  y el objetivo explícito de aprender el patrón, no solo entregar rápido.
- Cada entidad de dominio existe en dos formas: el objeto de dominio puro
  (`domain/Reunion`) y su equivalente de persistencia (`adaptadores/salida/jpa/ReunionJpaEntity`),
  con un adaptador (`ReunionRepositorioAdapter`) que mapea entre ambas.
- Cambiar de proveedor externo (ej. sustituir Whisper por otro servicio de
  transcripción) solo requiere reemplazar el adaptador correspondiente, sin
  tocar la lógica de negocio.
- La lógica de negocio (`domain/` y `servicio/`) se puede testear sin
  levantar Supabase, Whisper ni Firebase, usando implementaciones de prueba de
  los puertos de salida.
