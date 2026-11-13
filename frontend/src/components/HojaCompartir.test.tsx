import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { opcionesCompartir, type OpcionCompartir } from '../utils/detalleActa';
import { HojaCompartir } from './HojaCompartir';

const OPCIONES = opcionesCompartir({ hayResumen: true, hayTranscripcion: true, duracionMinutos: 72 });

const renderHoja = ({
  seleccionada = 'ACTA_PDF' as OpcionCompartir,
  comoEnlace = false as boolean | null,
  onSeleccionar = jest.fn(),
  onConfirmar = jest.fn(),
} = {}) =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 640 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ThemeProvider initialPreference="light">
        <HojaCompartir
          visible
          opciones={OPCIONES}
          seleccionada={seleccionada}
          onSeleccionar={onSeleccionar}
          comoEnlace={comoEnlace}
          onCambiarEnlace={jest.fn()}
          onConfirmar={onConfirmar}
          onCerrar={jest.fn()}
        />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

describe('HojaCompartir', () => {
  it('nombra el formato elegido en el botón principal', async () => {
    await renderHoja({ seleccionada: 'ACTA_WORD' });
    expect(screen.getByText('Compartir Word')).toBeTruthy();
  });

  it('elegir una opción no comparte: solo la marca', async () => {
    const onSeleccionar = jest.fn();
    const onConfirmar = jest.fn();
    await renderHoja({ onSeleccionar, onConfirmar });

    await fireEvent.press(screen.getByLabelText('Transcripción, PDF · 1h 12 min'));

    expect(onSeleccionar).toHaveBeenCalledWith('TRANSCRIPCION_PDF');
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it('con el enlace activado el botón crea el enlace de 24 h', async () => {
    await renderHoja({ comoEnlace: true });
    expect(screen.getByText('Crear enlace de 24 h')).toBeTruthy();
  });

  it('sin backend no ofrece el enlace', async () => {
    await renderHoja({ comoEnlace: null });
    expect(screen.queryByText('Enlace de 24 h')).toBeNull();
  });
});
