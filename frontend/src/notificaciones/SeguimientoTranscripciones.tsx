import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Aviso } from '../../components/ui';
import type { TonoAviso } from '../../components/ui/Aviso';
import { hayBackend, obtenerEstadosTranscripcion } from '../services/api';
import type { EstadoTranscripcion } from '../types';
import { ESTADOS_EN_CURSO, detectarTransiciones, textoAviso, type Transicion } from './transiciones';
import {
  alTocarNotificacion,
  appEnSegundoPlano,
  mostrarNotificacion,
  pedirPermisoNotificaciones,
} from './notificacionSistema';

/** Cada cuánto se consulta el estado mientras haya alguna transcripción en curso. */
const MS_ENTRE_SONDEOS = 2500;

/** Lo justo para leerlo sin que se quede tapando la cabecera de la pantalla. */
const MS_AVISO_VISIBLE = 6000;

export interface ReunionASeguir {
  id: string;
  titulo?: string;
  estado: EstadoTranscripcion;
}

interface ReunionConocida {
  titulo?: string;
  estado: EstadoTranscripcion;
}

interface AvisoEnApp {
  reunionId: string;
  tono: TonoAviso;
  mensaje: string;
}

interface ValorSeguimiento {
  /** Añade reuniones al seguimiento. Las que ya se avisaron se ignoran. */
  seguir: (reuniones: ReadonlyArray<ReunionASeguir>) => void;
  /** Para una reunión eliminada: el backend respondería PENDIENTE para siempre. */
  dejarDeSeguir: (reunionId: string) => void;
  /** Una sola vez por sesión; llamarlo dentro del gesto del usuario (ver `pedirPermisoNotificaciones`). */
  pedirPermisoAvisos: () => void;
  /** Último estado conocido de una reunión seguida, terminada o no. */
  estadoDe: (reunionId: string) => EstadoTranscripcion | undefined;
  /** La pantalla que ya está enseñando el progreso de esta reunión se encarga ella del final feliz. */
  observar: (reunionId: string) => () => void;
  /** Sube cada vez que alguna reunión termina, para que las listas recarguen. */
  versionTerminadas: number;
}

const ContextoSeguimiento = createContext<ValorSeguimiento | null>(null);

interface Props {
  children: ReactNode;
  onAbrirActa: (reunionId: string) => void;
}

/**
 * Sigue las transcripciones en curso y avisa cuando terminan, sin push
 * remoto: Expo Go Android no lo admite desde el SDK 53 y la web no tiene
 * service worker. Por eso el aviso solo llega con la app abierta o en
 * segundo plano, nunca con ella cerrada.
 */
export function SeguimientoTranscripciones({ children, onAbrirActa }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [reuniones, setReuniones] = useState<Record<string, ReunionConocida>>({});
  const [versionTerminadas, setVersionTerminadas] = useState(0);
  const [aviso, setAviso] = useState<AvisoEnApp | null>(null);
  const [appActiva, setAppActiva] = useState(AppState.currentState === 'active');

  const reunionesRef = useRef(reuniones);
  const avisadas = useRef(new Set<string>());
  const enPantalla = useRef(new Set<string>());
  const permisoPedido = useRef(false);

  useEffect(() => {
    reunionesRef.current = reuniones;
  }, [reuniones]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => setAppActiva(estado === 'active'));
    return () => suscripcion.remove();
  }, []);

  const abrirActa = useCallback(
    (reunionId: string) => {
      setAviso(null);
      onAbrirActa(reunionId);
    },
    [onAbrirActa],
  );

  useEffect(() => alTocarNotificacion(abrirActa), [abrirActa]);

  const avisar = useCallback(async (transicion: Transicion, tituloReunion?: string) => {
    const { titulo, cuerpo } = textoAviso(transicion, tituloReunion);
    if (appEnSegundoPlano() && (await mostrarNotificacion({ titulo, cuerpo, reunionId: transicion.reunionId }))) {
      return;
    }
    // Si falla, GrabacionScreen vuelve a la lista sin decir nada: ahí el aviso sí hace falta.
    if (transicion.estado === 'COMPLETADA' && enPantalla.current.has(transicion.reunionId) && !appEnSegundoPlano()) {
      return;
    }
    setAviso({
      reunionId: transicion.reunionId,
      tono: transicion.estado === 'COMPLETADA' ? 'info' : 'error',
      mensaje: cuerpo,
    });
  }, []);

  const procesar = useCallback(
    (actuales: Record<string, EstadoTranscripcion>) => {
      const conocidas = reunionesRef.current;
      const anteriores: Record<string, EstadoTranscripcion> = {};
      for (const [id, reunion] of Object.entries(conocidas)) anteriores[id] = reunion.estado;

      const transiciones = detectarTransiciones(anteriores, actuales, avisadas.current);
      for (const transicion of transiciones) avisadas.current.add(transicion.reunionId);

      setReuniones((previas) => {
        let cambio = false;
        const siguientes = { ...previas };
        for (const [id, estado] of Object.entries(actuales)) {
          const previa = previas[id];
          if (previa && previa.estado !== estado) {
            siguientes[id] = { ...previa, estado };
            cambio = true;
          }
        }
        return cambio ? siguientes : previas;
      });

      if (transiciones.length > 0) {
        setVersionTerminadas((v) => v + 1);
        for (const transicion of transiciones) avisar(transicion, conocidas[transicion.reunionId]?.titulo);
      }
    },
    [avisar],
  );

  // Cadena estable como dependencia: el efecto solo se reinicia si cambia
  // qué reuniones están en curso, no en cada tick que actualiza su estado.
  const idsEnCurso = useMemo(
    () =>
      Object.keys(reuniones)
        .filter((id) => ESTADOS_EN_CURSO.has(reuniones[id].estado))
        .sort()
        .join(','),
    [reuniones],
  );

  // En nativo el JS se congela en segundo plano (los timers no corren), así
  // que solo se sondea con la app activa y, al volver, de inmediato. En web
  // una pestaña oculta sigue ejecutando (el navegador espacia los timers),
  // y es justo ahí donde la notificación del sistema tiene sentido.
  const puedeSondear = Platform.OS === 'web' || appActiva;

  useEffect(() => {
    if (!idsEnCurso || !puedeSondear) return;
    const ids = idsEnCurso.split(',');
    // El backend en Render puede tardar >20 s en despertar: sin esto se
    // apilarían peticiones cada 2,5 s mientras la primera no responde.
    let enVuelo = false;

    const sondear = async () => {
      if (enVuelo) return;
      enVuelo = true;
      try {
        // El resultado se procesa aunque el efecto ya se haya limpiado: si
        // la app acaba de pasar a segundo plano, es justo el caso en que
        // toca notificación del sistema.
        procesar(await obtenerEstadosTranscripcion(ids));
      } catch {
        // Fallo de red puntual: el backend sigue procesando, se reintenta en el siguiente sondeo.
      } finally {
        enVuelo = false;
      }
    };

    sondear();
    const intervalo = setInterval(sondear, MS_ENTRE_SONDEOS);
    return () => clearInterval(intervalo);
  }, [idsEnCurso, puedeSondear, procesar]);

  // La cuenta atrás solo corre con la app a la vista: un aviso que llega con
  // la pestaña oculta y sin permiso de notificación sigue ahí al volver.
  useEffect(() => {
    if (!aviso || !appActiva) return;
    const temporizador = setTimeout(() => setAviso(null), MS_AVISO_VISIBLE);
    return () => clearTimeout(temporizador);
  }, [aviso, appActiva]);

  const seguir = useCallback((nuevas: ReadonlyArray<ReunionASeguir>) => {
    // Sin backend no hay nada real que sondear (ver `hayBackend`).
    if (!hayBackend) return;
    setReuniones((previas) => {
      let cambio = false;
      const siguientes = { ...previas };
      for (const { id, titulo, estado } of nuevas) {
        if (avisadas.current.has(id) || !ESTADOS_EN_CURSO.has(estado)) continue;
        const previa = previas[id];
        if (previa && ESTADOS_EN_CURSO.has(previa.estado)) {
          if (!previa.titulo && titulo) {
            siguientes[id] = { ...previa, titulo };
            cambio = true;
          }
          continue;
        }
        siguientes[id] = { titulo, estado };
        cambio = true;
      }
      return cambio ? siguientes : previas;
    });
  }, []);

  const dejarDeSeguir = useCallback((reunionId: string) => {
    setReuniones((previas) => {
      if (!(reunionId in previas)) return previas;
      const { [reunionId]: _eliminada, ...resto } = previas;
      return resto;
    });
  }, []);

  const pedirPermisoAvisos = useCallback(() => {
    if (!hayBackend || permisoPedido.current) return;
    permisoPedido.current = true;
    pedirPermisoNotificaciones();
  }, []);

  const estadoDe = useCallback((reunionId: string) => reuniones[reunionId]?.estado, [reuniones]);

  const observar = useCallback((reunionId: string) => {
    enPantalla.current.add(reunionId);
    return () => {
      enPantalla.current.delete(reunionId);
    };
  }, []);

  const valor = useMemo<ValorSeguimiento>(
    () => ({ seguir, dejarDeSeguir, pedirPermisoAvisos, estadoDe, observar, versionTerminadas }),
    [seguir, dejarDeSeguir, pedirPermisoAvisos, estadoDe, observar, versionTerminadas],
  );

  return (
    <ContextoSeguimiento.Provider value={valor}>
      <View style={{ flex: 1 }}>
        {children}
        {aviso && (
          // Arriba y no abajo: abajo están el FAB y la barra de pestañas.
          <View
            style={{
              position: 'absolute',
              top: Math.max(insets.top, t.spacing[3]) + t.spacing[2],
              left: 0,
              right: 0,
              alignItems: 'center',
              paddingHorizontal: t.spacing[4],
              pointerEvents: 'box-none',
            }}
          >
            <View style={{ width: '100%', maxWidth: 480, borderRadius: t.radius.md, boxShadow: t.shadows.md }}>
              <Aviso
                key={aviso.reunionId}
                tono={aviso.tono}
                mensaje={aviso.mensaje}
                onCerrar={() => setAviso(null)}
                accion={{ titulo: 'Ver acta', onPress: () => abrirActa(aviso.reunionId) }}
              />
            </View>
          </View>
        )}
      </View>
    </ContextoSeguimiento.Provider>
  );
}

export function useSeguimientoTranscripciones(): ValorSeguimiento {
  const ctx = useContext(ContextoSeguimiento);
  if (!ctx) throw new Error('useSeguimientoTranscripciones debe usarse dentro de <SeguimientoTranscripciones>');
  return ctx;
}
