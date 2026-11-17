import { Pressable, View } from 'react-native';
import { CalendarDays, CalendarPlus, Mic, Pencil, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Badge, Card, AvatarStack, EstadoVacio } from '../../components/ui';
import { FilaActa } from './ListaAgrupadaReuniones';
import { esFechaPasada, fechaCortaIso, fechaLarga, fechaLargaTitulo, horaYLugar, type EventosDia } from '../utils/calendario';
import type { ActaResumen, ReunionProgramada } from '../types';

interface Props {
  fechaIso: string;
  hoyIso: string;
  eventos: EventosDia;
  /** Las siguientes convocadas desde hoy, para no tener que recorrer el calendario para encontrarlas. */
  proximas: ReadonlyArray<ReunionProgramada>;
  onAbrirActa: (acta: ActaResumen) => void;
  onProgramar: () => void;
  onEditar: (reunion: ReunionProgramada) => void;
  onGrabar: (reunion: ReunionProgramada) => void;
  onCancelar: (reunion: ReunionProgramada) => void;
  /** Al pulsar una de "Próximas": lleva el calendario a ese día. */
  onIrADia: (fechaIso: string) => void;
}

/**
 * Lo que hay el día elegido en el calendario: primero las programadas (piden
 * acción: grabar, editar, cancelar) y después las ya grabadas, que abren su
 * acta. Debajo, "Próximas" con las siguientes convocatorias.
 */
export function EventosDelDia({ fechaIso, hoyIso, eventos, proximas, onAbrirActa, onProgramar, onEditar, onGrabar, onCancelar, onIrADia }: Props) {
  const t = useTheme();
  const total = eventos.programadas.length + eventos.actas.length;
  const pasado = esFechaPasada(fechaIso, hoyIso);
  const titulo = fechaLargaTitulo(fechaIso);

  return (
    <View style={{ gap: t.spacing[5] }}>
      <View style={{ gap: t.spacing[1] }}>
        <Text variant="titleSm" accessibilityRole="header">
          {titulo}
        </Text>
        <Text variant="caption" color="text2">
          {total === 0 ? 'Sin reuniones' : total === 1 ? '1 reunión' : `${total} reuniones`}
        </Text>
      </View>

      {total === 0 ? (
        <EstadoVacio
          icono={CalendarDays}
          tono="neutro"
          titulo="Nada este día"
          descripcion={pasado ? 'No se grabó ninguna reunión este día.' : 'Convoca una reunión y aparecerá aquí, lista para grabarla llegado el día.'}
          accion={pasado ? undefined : { titulo: 'Programar reunión', onPress: onProgramar, variante: 'secondary', icono: CalendarPlus }}
          style={{ paddingVertical: t.spacing[8] }}
        />
      ) : (
        <View style={{ gap: t.spacing[3] }}>
          {eventos.programadas.map((reunion) => (
            <TarjetaProgramada
              key={reunion.id}
              reunion={reunion}
              onEditar={() => onEditar(reunion)}
              onGrabar={() => onGrabar(reunion)}
              onCancelar={() => onCancelar(reunion)}
            />
          ))}
          {eventos.actas.length > 0 && (
            <View>
              {eventos.actas.map((acta) => (
                <FilaActa key={acta.id} acta={acta} onPress={() => onAbrirActa(acta)} />
              ))}
            </View>
          )}
          {!pasado && (
            <Button
              label="Programar otra reunión"
              variant="ghost"
              size="sm"
              icon={(c) => <CalendarPlus size={t.size.iconSm} color={c} strokeWidth={1.6} />}
              onPress={onProgramar}
            />
          )}
        </View>
      )}

      <View style={{ gap: t.spacing[2] }}>
        <Text variant="overline" color="text2" accessibilityRole="header">
          Próximas
        </Text>
        {proximas.length === 0 ? (
          <Text variant="caption" color="text2">
            No hay reuniones programadas.
          </Text>
        ) : (
          proximas.map((reunion) => <FilaProxima key={reunion.id} reunion={reunion} onPress={() => onIrADia(reunion.fechaIso)} />)
        )}
      </View>
    </View>
  );
}

interface PropsTarjeta {
  reunion: ReunionProgramada;
  onEditar: () => void;
  onGrabar: () => void;
  onCancelar: () => void;
}

/** `Card.html` del kit: badge "Programada" con la hora, título, fecha y lugar; aquí además las tres acciones. */
function TarjetaProgramada({ reunion, onEditar, onGrabar, onCancelar }: PropsTarjeta) {
  const t = useTheme();
  const detalle = horaYLugar(reunion);
  return (
    <Card style={{ padding: t.spacing[4], gap: t.spacing[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Badge label="Programada" tone="neutral" />
        {reunion.hora && (
          <Text variant="metadata" color="text2">
            {reunion.hora}
          </Text>
        )}
      </View>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {reunion.titulo}
        </Text>
        {detalle !== '' && (
          <Text variant="caption" color="text2" numberOfLines={1}>
            {detalle}
          </Text>
        )}
      </View>
      {reunion.participantes.length > 0 && <AvatarStack participantes={reunion.participantes} fondo="surface" />}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: t.spacing[2] }}>
        <Button
          label="Grabar ahora"
          size="sm"
          icon={(c) => <Mic size={t.size.iconSm} color={c} strokeWidth={1.6} />}
          onPress={onGrabar}
        />
        <Button label="Editar" variant="ghost" size="sm" icon={(c) => <Pencil size={t.size.iconSm} color={c} strokeWidth={1.6} />} onPress={onEditar} />
        <Button label="Cancelar" variant="ghost" size="sm" icon={(c) => <Trash2 size={t.size.iconSm} color={c} strokeWidth={1.6} />} onPress={onCancelar} />
      </View>
    </Card>
  );
}

function FilaProxima({ reunion, onPress }: { reunion: ReunionProgramada; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${reunion.titulo}, ${fechaLarga(reunion.fechaIso)}${reunion.hora ? `, ${reunion.hora}` : ''}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[3],
        paddingVertical: t.spacing[2],
        paddingHorizontal: t.spacing[2],
        marginHorizontal: -t.spacing[2],
        borderRadius: t.radius.sm,
        backgroundColor: pressed ? t.colors.fillPress : 'transparent',
      })}
    >
      <Text variant="metadata" color="text2" style={{ width: 48 }}>
        {fechaCortaIso(reunion.fechaIso)}
      </Text>
      <Text variant="body" numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>
        {reunion.titulo}
      </Text>
      {reunion.hora && (
        <Text variant="metadata" color="text2">
          {reunion.hora}
        </Text>
      )}
    </Pressable>
  );
}
