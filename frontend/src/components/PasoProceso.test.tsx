import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { lightColors } from '../../theme/tokens';
import { PasoProceso, type EstadoPaso } from './PasoProceso';

const renderPaso = (estado: EstadoPaso, atenuacion?: number) =>
  render(
    <ThemeProvider initialPreference="light">
      <PasoProceso texto="Transcribiendo audio" estado={estado} atenuacion={atenuacion} />
    </ThemeProvider>,
  );

describe('PasoProceso', () => {
  it('muestra el texto del paso', async () => {
    await renderPaso('pendiente');

    expect(screen.getByText('Transcribiendo audio')).toBeOnTheScreen();
  });

  it('completado y activo usan el color de texto principal; pendiente el secundario', async () => {
    const { unmount } = await renderPaso('completado');
    expect(screen.getByText('Transcribiendo audio')).toHaveStyle({ color: lightColors.text });
    await unmount();

    const activo = await renderPaso('activo');
    expect(screen.getByText('Transcribiendo audio')).toHaveStyle({ color: lightColors.text });
    await activo.unmount();

    await renderPaso('pendiente');
    expect(screen.getByText('Transcribiendo audio')).toHaveStyle({ color: lightColors.text2 });
  });

  it('aplica la atenuación como opacidad de la fila', async () => {
    await renderPaso('pendiente', 0.4);

    expect(screen.getByText('Transcribiendo audio').parent).toHaveStyle({ opacity: 0.4 });
  });
});
