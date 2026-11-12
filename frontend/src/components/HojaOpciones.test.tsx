import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Trash2 } from 'lucide-react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { lightColors } from '../../theme/tokens';
import { HojaOpciones, type OpcionHoja } from './HojaOpciones';

const OPCIONES: ReadonlyArray<OpcionHoja<'eliminar' | 'cancelar'>> = [
  { id: 'eliminar', titulo: 'Eliminar acta', icono: Trash2, destructiva: true },
  { id: 'cancelar', titulo: 'Cancelar' },
];

const renderHoja = (onSeleccionar = jest.fn()) =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 640 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ThemeProvider initialPreference="light">
        <HojaOpciones visible titulo="¿Eliminar?" opciones={OPCIONES} onSeleccionar={onSeleccionar} onCerrar={jest.fn()} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

describe('HojaOpciones', () => {
  it('entrega el id de la opción pulsada', async () => {
    const onSeleccionar = jest.fn();
    await renderHoja(onSeleccionar);

    await fireEvent.press(screen.getByLabelText('Eliminar acta'));

    expect(onSeleccionar).toHaveBeenCalledWith('eliminar');
  });

  it('pinta con el color de error solo el título de la opción destructiva', async () => {
    await renderHoja();

    expect(screen.getByText('Eliminar acta')).toHaveStyle({ color: lightColors.danger });
    expect(screen.getByText('Cancelar')).not.toHaveStyle({ color: lightColors.danger });
  });
});
