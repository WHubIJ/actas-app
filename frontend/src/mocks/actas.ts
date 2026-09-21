import type { ActaDetalle } from '../types';

/**
 * Datos de ejemplo para maquetar "Mis actas" y el detalle del acta.
 *
 * TEMPORAL: se borra entero en cuanto existan `GET /api/reuniones` y
 * `GET /api/reuniones/{id}`. No importar desde componentes reutilizables,
 * solo desde las pantallas.
 *
 * Los cuatro registros cubren a propósito los cuatro casos que la pantalla de
 * detalle tiene que saber pintar: transcrita con resumen, transcrita sin
 * resumen todavía, transcripción en curso y transcripción fallida.
 */
export const ACTAS_EJEMPLO: ActaDetalle[] = [
  {
    id: '1',
    titulo: 'Reunión equipo marketing',
    fecha: '12 septiembre 2026',
    duracionMinutos: 48,
    participantes: ['Ana', 'Carlos', 'Lucía', 'Marta', 'Nuria'],
    estadoTranscripcion: 'COMPLETADA',
    plantillaResumen: 'ACTA_FORMAL',
    resumen: [
      {
        id: 'acuerdos',
        titulo: 'Acuerdos',
        puntos: [
          'Se aprueba el presupuesto de campaña para el último trimestre.',
          'La revisión de materiales pasa a ser quincenal en lugar de mensual.',
          'Ana coordina la próxima sesión con el equipo de contenidos.',
        ],
      },
      {
        id: 'temas',
        titulo: 'Temas tratados',
        puntos: [
          'Resultados de la campaña de septiembre y desviación respecto al objetivo.',
          'Reparto de responsabilidades para la próxima acción conjunta.',
          'Calendario de publicaciones hasta diciembre.',
        ],
      },
      {
        id: 'pendientes',
        titulo: 'Pendientes',
        puntos: [
          'Carlos envía el informe de métricas antes del viernes.',
          'Queda por cerrar el proveedor de impresión.',
        ],
      },
    ],
    intervenciones: [
      {
        id: 'i1',
        interviniente: 'Ana',
        marca: '00:12',
        texto:
          'Buenos días a todos. Empezamos repasando los resultados de la campaña de septiembre y luego vemos el reparto para el próximo trimestre.',
      },
      {
        id: 'i2',
        interviniente: 'Carlos',
        marca: '01:04',
        texto:
          'He preparado los números. Hemos quedado un ocho por ciento por debajo del objetivo, pero el coste por contacto ha bajado bastante respecto a agosto.',
      },
      {
        id: 'i3',
        interviniente: 'Lucía',
        marca: '03:27',
        texto:
          'Eso encaja con lo que veíamos en redes. El alcance orgánico subió, lo que no acompañó fue la conversión en la página de destino.',
      },
      {
        id: 'i4',
        interviniente: 'Marta',
        marca: '05:41',
        texto:
          'Propongo que la revisión de materiales pase a ser quincenal. Mensual se nos queda largo y llegamos tarde a los ajustes.',
      },
      {
        id: 'i5',
        interviniente: 'Ana',
        marca: '06:58',
        texto:
          'De acuerdo. Lo dejamos quincenal a partir de octubre y yo coordino la sesión con el equipo de contenidos.',
      },
    ],
  },
  {
    id: '2',
    titulo: 'Kick-off producto Q4',
    fecha: '8 septiembre 2026',
    duracionMinutos: 72,
    participantes: ['Javier', 'Elena', 'Miguel'],
    estadoTranscripcion: 'COMPLETADA',
    plantillaResumen: null,
    resumen: null,
    intervenciones: [
      {
        id: 'i1',
        interviniente: 'Javier',
        marca: '00:08',
        texto:
          'Arrancamos el trimestre. La idea es cerrar hoy el alcance y salir con las tres primeras tareas asignadas.',
      },
      {
        id: 'i2',
        interviniente: 'Elena',
        marca: '02:15',
        texto:
          'Antes de repartir, necesito que aclaremos si la integración de pagos entra en esta fase o la dejamos para enero.',
      },
      {
        id: 'i3',
        interviniente: 'Miguel',
        marca: '04:33',
        texto:
          'Entra, pero solo la parte de cobro recurrente. Lo demás no tiene sentido hasta que haya volumen suficiente.',
      },
    ],
  },
  {
    id: '3',
    titulo: 'Revisión financiera mensual',
    fecha: '5 septiembre 2026',
    duracionMinutos: 35,
    participantes: ['Beatriz', 'Raúl'],
    estadoTranscripcion: 'EN_PROCESO',
    plantillaResumen: null,
    resumen: null,
    intervenciones: [],
  },
  {
    id: '4',
    titulo: 'Junta directiva extraordinaria',
    fecha: '1 septiembre 2026',
    duracionMinutos: 96,
    participantes: ['Pablo', 'Sara', 'Tomás', 'Iván', 'Rocío', 'Diego'],
    estadoTranscripcion: 'FALLIDA',
    plantillaResumen: null,
    resumen: null,
    intervenciones: [],
  },
];

export function buscarActa(id: string): ActaDetalle | undefined {
  return ACTAS_EJEMPLO.find((acta) => acta.id === id);
}
