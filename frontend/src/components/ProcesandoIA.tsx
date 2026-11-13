import { View } from 'react-native';
import { BellRing } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Badge, Card, Aviso } from '../../components/ui';
import { PasoProceso } from './PasoProceso';
import type { EstadoTranscripcion } from '../types';
import { pasosDeProcesado } from '../utils/procesadoActa';

interface Props {
  titulo: string;
  /** Fecha y duración, ya formateadas. */
  metadatos: string;
  /** Estado agregado de la transcripción en el backend; `undefined` hasta el primer sondeo. */
  transcripcion: EstadoTranscripcion | undefined;
  /** Escritorio: el título de página sube a `heading`. */
  amplio?: boolean;
  /** La transcripción falló: se cambian los pasos por el aviso de error. */
  mensajeError?: string;
}

/**
 * Estado "Procesando" (`ma-ai-steps`): lo que ya se sabe de la reunión y los
 * pasos que el backend recorre de verdad. No hay estimación numérica porque el
 * backend no la da; solo se promete lo que sí es cierto.
 */
export function ProcesandoIA({ titulo, metadatos, transcripcion, amplio, mensajeError }: Props) {
  const t = useTheme();
  // Esta pantalla solo existe tras finalizar, o sea con el audio ya subido y registrado.
  const pasos = pasosDeProcesado({ audioSubido: true, transcripcion });

  return (
    <View style={{ width: '100%', gap: t.spacing[5] }}>
      <View style={{ gap: t.spacing[2] }}>
        <Badge label={mensajeError ? 'No se pudo transcribir' : 'Procesando'} tone={mensajeError ? 'danger' : 'brand'} />
        <Text variant={amplio ? 'heading' : 'title'} style={{ marginTop: t.spacing[1] }}>
          {titulo}
        </Text>
        <Text variant="metadata" color="text2">
          {metadatos}
        </Text>
      </View>

      {mensajeError ? (
        <Aviso tono="error" mensaje={mensajeError} />
      ) : (
        <>
          <Card style={{ gap: t.spacing[4] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: t.spacing[3] }}>
              <Text variant="titleSm">Preparando el acta</Text>
              <Text variant="caption" color="text2" style={{ flexShrink: 1, textAlign: 'right' }}>
                Suele tardar unos minutos
              </Text>
            </View>

            <View style={{ gap: t.spacing[3] }}>
              {pasos.map((paso) => (
                <PasoProceso key={paso.id} texto={paso.texto} estado={paso.estado} detalle={paso.detalle} />
              ))}
            </View>
          </Card>

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing[2] }}>
            <BellRing size={16} color={t.colors.text2} strokeWidth={1.6} style={{ marginTop: 1 }} />
            <Text variant="caption" color="text2" style={{ flex: 1 }}>
              Puedes salir de esta pantalla. Te avisaremos cuando el acta esté lista.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}
