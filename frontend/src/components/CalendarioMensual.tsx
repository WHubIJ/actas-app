import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button } from '../../components/ui';
import {
  DIAS_SEMANA_CORTOS,
  eventosDe,
  fechaLarga,
  mesRelativo,
  semanasDelMes,
  tituloMes,
  type DiaCalendario,
  type EventosDia,
  type Mes,
} from '../utils/calendario';

interface Props {
  mes: Mes;
  seleccionado: string;
  hoyIso: string;
  eventos: ReadonlyMap<string, EventosDia>;
  onSeleccionar: (fechaIso: string) => void;
  onCambiarMes: (mes: Mes) => void;
  /** Celdas más bajas para el móvil, donde el calendario comparte pantalla con la lista del día. */
  compacto?: boolean;
}

/** Lado del círculo que marca el día de hoy y de los puntos de evento; medidas del kit que no son token. */
const LADO_HOY = 24;
const LADO_PUNTO = 6;
/** Más de tres puntos no caben en una celda y tampoco dicen nada más que "varias". */
const MAXIMO_PUNTOS = 3;

/**
 * Rejilla mensual, de lunes a domingo (`Tabs.html` prevé "Lista | Calendario";
 * el kit no dibuja la rejilla, así que sigue sus reglas: superficie, hairlines,
 * marca solo para selección y hoy). Cada día lleva un punto por reunión:
 * violeta las programadas, gris las ya grabadas.
 */
export function CalendarioMensual({ mes, seleccionado, hoyIso, eventos, onSeleccionar, onCambiarMes, compacto = false }: Props) {
  const t = useTheme();
  const semanas = useMemo(() => semanasDelMes(mes), [mes]);
  const hoyEnEsteMes = hoyIso.startsWith(`${mes.anio}-${String(mes.mes + 1).padStart(2, '0')}`);

  const irAHoy = () => {
    const [anio, mesHoy] = hoyIso.split('-').map(Number);
    onCambiarMes({ anio, mes: mesHoy - 1 });
    onSeleccionar(hoyIso);
  };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing[3] }}>
        <Text variant="titleSm" accessibilityRole="header" accessibilityLiveRegion="polite">
          {tituloMes(mes)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
          {!hoyEnEsteMes && <Button label="Hoy" variant="ghost" size="sm" onPress={irAHoy} />}
          <BotonMes etiqueta="Mes anterior" onPress={() => onCambiarMes(mesRelativo(mes, -1))}>
            <ChevronLeft size={t.size.iconSm} color={t.colors.text2} strokeWidth={1.6} />
          </BotonMes>
          <BotonMes etiqueta="Mes siguiente" onPress={() => onCambiarMes(mesRelativo(mes, 1))}>
            <ChevronRight size={t.size.iconSm} color={t.colors.text2} strokeWidth={1.6} />
          </BotonMes>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: t.spacing[4], paddingBottom: t.spacing[2], borderBottomWidth: 1, borderBottomColor: t.colors.border }}>
        {DIAS_SEMANA_CORTOS.map((dia, i) => (
          <Text key={i} variant="overline" color="text2" style={{ flex: 1, textAlign: 'center' }}>
            {dia}
          </Text>
        ))}
      </View>

      {semanas.map((semana, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
          {semana.map((dia) => (
            <Celda
              key={dia.fechaIso}
              dia={dia}
              eventos={eventosDe(eventos, dia.fechaIso)}
              esHoy={dia.fechaIso === hoyIso}
              seleccionado={dia.fechaIso === seleccionado}
              compacto={compacto}
              onPress={() => onSeleccionar(dia.fechaIso)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function BotonMes({ etiqueta, onPress, children }: { etiqueta: string; onPress: () => void; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      hitSlop={6}
      style={({ pressed }) => ({
        width: t.size.controlSm,
        height: t.size.controlSm,
        borderRadius: t.radius.sm,
        borderWidth: 1,
        borderColor: t.colors.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? t.colors.fillPress : t.colors.surface,
      })}
    >
      {children}
    </Pressable>
  );
}

interface PropsCelda {
  dia: DiaCalendario;
  eventos: EventosDia;
  esHoy: boolean;
  seleccionado: boolean;
  compacto: boolean;
  onPress: () => void;
}

function Celda({ dia, eventos, esHoy, seleccionado, compacto, onPress }: PropsCelda) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  const total = eventos.programadas.length + eventos.actas.length;
  // Programadas primero: son las que piden acción; el resto de puntos ya son pasado.
  const puntos = [
    ...eventos.programadas.map(() => t.colors.brand),
    ...eventos.actas.map(() => t.colors.text2),
  ].slice(0, MAXIMO_PUNTOS);

  const descripcion =
    total === 0 ? 'sin reuniones' : total === 1 ? '1 reunión' : `${total} reuniones`;

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      // Los días de relleno no se eligen: para verlos se cambia de mes.
      disabled={!dia.delMes}
      accessibilityRole="button"
      accessibilityLabel={`${fechaLarga(dia.fechaIso)}, ${descripcion}`}
      accessibilityState={{ selected: seleccionado, disabled: !dia.delMes }}
      style={{
        flex: 1,
        minHeight: compacto ? 48 : 72,
        padding: compacto ? 4 : t.spacing[2],
        borderRadius: t.radius.md,
        borderWidth: 1,
        borderColor: seleccionado ? t.colors.brand : 'transparent',
        backgroundColor: seleccionado ? t.colors.brandSoft : hover && dia.delMes ? t.colors.fillHover : 'transparent',
        justifyContent: 'space-between',
      }}
    >
      <View
        style={{
          width: LADO_HOY,
          height: LADO_HOY,
          borderRadius: t.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: esHoy ? t.colors.brand : 'transparent',
        }}
      >
        <Text
          variant={esHoy || seleccionado ? 'bodyStrong' : 'body'}
          color={esHoy ? 'onBrand' : dia.delMes ? 'text' : 'text3'}
          style={{ fontSize: 13, lineHeight: 16 }}
        >
          {dia.dia}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 3, minHeight: LADO_PUNTO, paddingLeft: compacto ? 4 : 2 }}>
        {dia.delMes &&
          puntos.map((color, i) => (
            <View key={i} style={{ width: LADO_PUNTO, height: LADO_PUNTO, borderRadius: t.radius.full, backgroundColor: color }} />
          ))}
      </View>
    </Pressable>
  );
}
