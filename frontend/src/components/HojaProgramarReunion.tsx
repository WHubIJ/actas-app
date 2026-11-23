import { useCallback, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Clock, FileText, MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Input, Aviso } from '../../components/ui';
import { Hoja } from './Hoja';
import { ListaParticipantes } from './ListaParticipantes';
import { CampoParticipante } from './CampoParticipante';
import { ErrorApi, type DatosReunionProgramada } from '../services/api';
import { esFechaPasada, formatearFechaEntrada, parsearFechaEntrada, parsearHoraEntrada } from '../utils/calendario';
import type { ReunionProgramada } from '../types';

interface Props {
  visible: boolean;
  /** Reunión a editar. Sin ella, se convoca una nueva para `fechaIsoInicial`. */
  reunion: ReunionProgramada | null;
  fechaIsoInicial: string;
  hoyIso: string;
  nombreUsuario?: string | null;
  /** Lanza `ErrorApi` si el backend la rechaza; la hoja enseña el mensaje y sigue abierta. */
  onGuardar: (datos: DatosReunionProgramada) => Promise<void>;
  onCerrar: () => void;
}

/** La hoja no debe tapar toda la pantalla en móvil: deja ver que hay un velo detrás. */
const FRACCION_ALTO_MAXIMO = 0.72;

/**
 * Formulario de convocatoria (ADR-008): título, fecha, hora, lugar y
 * participantes. Fecha y hora se escriben a mano (`dd/mm/aaaa`, `hh:mm`): la
 * fecha ya viene del día elegido en el calendario, y un selector propio no
 * aportaría más que validar bien lo escrito.
 *
 * El formulario solo se monta mientras la hoja está abierta: así cada
 * apertura parte de la reunión a editar o del día elegido, nunca de lo que
 * quedó escrito la vez anterior, sin sincronizar estado en un efecto.
 */
export function HojaProgramarReunion({ visible, onCerrar, ...formulario }: Props) {
  return (
    <Hoja visible={visible} onCerrar={onCerrar}>
      {visible && <Formulario {...formulario} onCerrar={onCerrar} />}
    </Hoja>
  );
}

function Formulario({ reunion, fechaIsoInicial, hoyIso, nombreUsuario, onGuardar, onCerrar }: Omit<Props, 'visible'>) {
  const t = useTheme();
  const { height } = useWindowDimensions();
  const [titulo, setTitulo] = useState(reunion?.titulo ?? '');
  const [fecha, setFecha] = useState(formatearFechaEntrada(reunion?.fechaIso ?? fechaIsoInicial));
  const [hora, setHora] = useState(reunion?.hora ?? '');
  const [lugar, setLugar] = useState(reunion?.lugar ?? '');
  const [participantes, setParticipantes] = useState<string[]>(reunion?.participantes ?? []);
  const [nuevoParticipante, setNuevoParticipante] = useState('');
  const [errorFecha, setErrorFecha] = useState<string | undefined>();
  const [errorHora, setErrorHora] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const añadirParticipante = useCallback(() => {
    const nombre = nuevoParticipante.trim();
    if (!nombre) return;
    setParticipantes((actuales) => (actuales.includes(nombre) ? actuales : [...actuales, nombre]));
    setNuevoParticipante('');
  }, [nuevoParticipante]);

  // El error de un campo se refiere a lo que había escrito al pulsar Guardar:
  // en cuanto se corrige deja de ser cierto, así que se quita al escribir.
  const cambiarFecha = useCallback((valor: string) => {
    setFecha(valor);
    setErrorFecha(undefined);
  }, []);

  const cambiarHora = useCallback((valor: string) => {
    setHora(valor);
    setErrorHora(undefined);
  }, []);

  const quitarParticipante = useCallback((nombre: string) => {
    setParticipantes((actuales) => actuales.filter((p) => p !== nombre));
  }, []);

  const guardar = useCallback(async () => {
    const fechaLeida = parsearFechaEntrada(fecha);
    const horaLeida = parsearHoraEntrada(hora);
    setErrorFecha(fechaLeida.ok ? (esFechaPasada(fechaLeida.valor, hoyIso) ? 'No se puede programar en una fecha pasada.' : undefined) : fechaLeida.error);
    setErrorHora(horaLeida.ok ? undefined : horaLeida.error);
    if (!fechaLeida.ok || !horaLeida.ok || esFechaPasada(fechaLeida.valor, hoyIso)) return;

    setError(null);
    setGuardando(true);
    try {
      await onGuardar({
        fechaIso: fechaLeida.valor,
        hora: horaLeida.valor,
        lugar: lugar.trim() || null,
        titulo: titulo.trim() || null,
        participantes,
      });
    } catch (err) {
      setError(err instanceof ErrorApi ? err.message : 'No se pudo guardar la reunión. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }, [fecha, hora, hoyIso, lugar, titulo, participantes, onGuardar]);

  const editando = reunion !== null;

  return (
    <>
      <View style={{ gap: t.spacing[1], marginBottom: t.spacing[4] }}>
        <Text variant="titleSm" accessibilityRole="header">
          {editando ? 'Editar reunión' : 'Programar reunión'}
        </Text>
        <Text variant="caption" color="text2">
          Solo la fecha es obligatoria. Llegado el día, la grabas desde el calendario.
        </Text>
      </View>

      <ScrollView
        style={{ maxHeight: height * FRACCION_ALTO_MAXIMO }}
        contentContainerStyle={{ gap: t.spacing[4] }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Input
          label="Título"
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ej. Junta directiva de diciembre"
          icon={(c) => <FileText size={20} color={c} strokeWidth={1.6} />}
        />
        <View style={{ flexDirection: 'row', gap: t.spacing[3] }}>
          <View style={{ flex: 1 }}>
            <Input
              label="Fecha"
              value={fecha}
              onChangeText={cambiarFecha}
              placeholder="dd/mm/aaaa"
              error={errorFecha}
              keyboardType="numbers-and-punctuation"
              autoCorrect={false}
              // Viene rellenada con el día elegido: al entrar se selecciona entera
              // para que escribir la sustituya en vez de añadirse detrás.
              selectTextOnFocus
              maxLength={10}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Hora"
              value={hora}
              onChangeText={cambiarHora}
              placeholder="hh:mm"
              error={errorHora}
              keyboardType="numbers-and-punctuation"
              autoCorrect={false}
              selectTextOnFocus
              maxLength={5}
              icon={(c) => <Clock size={20} color={c} strokeWidth={1.6} />}
            />
          </View>
        </View>
        <Input
          label="Lugar"
          value={lugar}
          onChangeText={setLugar}
          placeholder="Ej. Salón anexo"
          icon={(c) => <MapPin size={20} color={c} strokeWidth={1.6} />}
        />

        <View style={{ gap: t.spacing[2] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="overline" color="text2">
              Participantes
            </Text>
            <Text variant="metadata" color="text2" accessibilityLabel={`${participantes.length} añadidos`}>
              {participantes.length}
            </Text>
          </View>
          <ListaParticipantes participantes={participantes} nombreUsuario={nombreUsuario} onQuitar={quitarParticipante} />
          <CampoParticipante valor={nuevoParticipante} onCambiar={setNuevoParticipante} onAnadir={añadirParticipante} />
        </View>
      </ScrollView>

      <View style={{ gap: t.spacing[3], marginTop: t.spacing[5] }}>
        {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing[2] }}>
          <Button label="Cancelar" variant="ghost" onPress={onCerrar} disabled={guardando} />
          <Button label={editando ? 'Guardar cambios' : 'Programar'} loading={guardando} onPress={guardar} />
        </View>
      </View>
    </>
  );
}
