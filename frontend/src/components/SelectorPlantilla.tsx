import { View } from 'react-native';
import { FileText, ListChecks, ScrollText, type LucideIcon } from 'lucide-react-native';
import { FilaOpcionRadio } from './FilaOpcionRadio';
import { ETIQUETA_PLANTILLA } from '../utils/detalleActa';
import type { PlantillaResumen } from '../types';

const PLANTILLAS: ReadonlyArray<{ id: PlantillaResumen; descripcion: string; icono: LucideIcon }> = [
  { id: 'ACTA_FORMAL', descripcion: 'Orden del día, desarrollo, acuerdos y cierre.', icono: ScrollText },
  { id: 'RESUMEN_EJECUTIVO', descripcion: 'Media página con lo esencial de la reunión.', icono: FileText },
  { id: 'LISTA_ACUERDOS', descripcion: 'Acuerdos y tareas, con responsable y plazo si se mencionaron.', icono: ListChecks },
];

/** Elección de plantilla antes de pedir el resumen. Elegir no genera: lo hace el botón de IA. */
export function SelectorPlantilla({
  elegida,
  onElegir,
  disabled,
}: {
  elegida: PlantillaResumen;
  onElegir: (plantilla: PlantillaResumen) => void;
  disabled?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup">
      {PLANTILLAS.map((p, i) => (
        <FilaOpcionRadio
          key={p.id}
          titulo={ETIQUETA_PLANTILLA[p.id]}
          descripcion={p.descripcion}
          icono={p.icono}
          activa={p.id === elegida}
          onPress={() => onElegir(p.id)}
          ultima={i === PLANTILLAS.length - 1}
          disabled={disabled}
        />
      ))}
    </View>
  );
}
