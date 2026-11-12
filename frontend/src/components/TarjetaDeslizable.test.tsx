import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { lightColors } from '../../theme/tokens';
import { TarjetaDeslizable } from './TarjetaDeslizable';

const renderConTema = (ui: React.ReactElement) => render(<ThemeProvider initialPreference="light">{ui}</ThemeProvider>);

describe('TarjetaDeslizable', () => {
  it('renderiza la tarjeta hija', async () => {
    await renderConTema(
      <TarjetaDeslizable onDeslizar={jest.fn()}>
        <Text>Reunión de junta</Text>
      </TarjetaDeslizable>,
    );

    expect(screen.getByText('Reunión de junta')).toBeOnTheScreen();
  });

  it('deja debajo un fondo de peligro con el icono de papelera, oculto en reposo', async () => {
    const onDeslizar = jest.fn();
    await renderConTema(
      <TarjetaDeslizable onDeslizar={onDeslizar}>
        <Text>Reunión de junta</Text>
      </TarjetaDeslizable>,
    );

    const fondo = screen.getByTestId('fondo-eliminar');
    expect(fondo).toHaveStyle({ backgroundColor: lightColors.danger, opacity: 0 });
    expect(JSON.stringify(screen.toJSON())).toContain(`"stroke":"${lightColors.onBrand}"`);
    expect(onDeslizar).not.toHaveBeenCalled();
  });
});
