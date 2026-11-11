import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { lightColors } from '../../theme/tokens';
import { Button } from './Button';

// Tema fijo en claro: si dependiera del esquema del sistema, los tests
// cambiarían de resultado según la máquina.
const renderConTema = (ui: React.ReactElement) => render(<ThemeProvider initialPreference="light">{ui}</ThemeProvider>);

describe('Button', () => {
  it('muestra la etiqueta y dispara onPress al pulsar', async () => {
    const onPress = jest.fn();
    await renderConTema(<Button label="Grabar reunión" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Grabar reunión' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('no dispara onPress cuando está deshabilitado', async () => {
    const onPress = jest.fn();
    await renderConTema(<Button label="Enviar" disabled onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Enviar' }));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('en estado loading queda ocupado y no dispara onPress', async () => {
    const onPress = jest.fn();
    await renderConTema(<Button label="Guardando" loading onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Guardando' }));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Guardando' })).toBeBusy();
  });

  it('pinta el icono con el color de su variante', async () => {
    const icon = jest.fn(() => null);
    await renderConTema(<Button label="Resumir" variant="ai" icon={icon} />);

    expect(icon).toHaveBeenCalledWith(lightColors.brandStrong);
  });
});
