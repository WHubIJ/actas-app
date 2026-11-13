import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { lightColors } from '../../theme/tokens';
import { PasoProceso, type EstadoPaso } from './PasoProceso';

const renderPaso = (estado: EstadoPaso, detalle?: string) =>
  render(
    <ThemeProvider initialPreference="light">
      <PasoProceso texto="Transcribiendo" estado={estado} detalle={detalle} />
    </ThemeProvider>,
  );

describe('PasoProceso', () => {
  it('muestra el texto del paso', async () => {
    await renderPaso('pendiente');

    expect(screen.getByText('Transcribiendo')).toBeOnTheScreen();
  });

  it('hecho y en curso usan el color de texto principal; pendiente el atenuado', async () => {
    const { unmount } = await renderPaso('completado');
    expect(screen.getByText('Transcribiendo')).toHaveStyle({ color: lightColors.text });
    await unmount();

    const activo = await renderPaso('activo');
    expect(screen.getByText('Transcribiendo')).toHaveStyle({ color: lightColors.text });
    await activo.unmount();

    await renderPaso('pendiente');
    expect(screen.getByText('Transcribiendo')).toHaveStyle({ color: lightColors.text3 });
  });

  it('solo el paso en curso va en negrita media', async () => {
    const activo = await renderPaso('activo');
    const fuenteActiva = screen.getByText('Transcribiendo').props.style;
    expect(fuenteActiva).toEqual(expect.arrayContaining([expect.objectContaining({ fontFamily: 'Geist_500Medium' })]));
    await activo.unmount();

    await renderPaso('completado');
    const fuenteHecha = screen.getByText('Transcribiendo').props.style;
    expect(fuenteHecha).toEqual(expect.arrayContaining([expect.objectContaining({ fontFamily: 'Geist_400Regular' })]));
  });

  it.each<[EstadoPaso, string]>([
    ['completado', 'Transcribiendo, hecho'],
    ['activo', 'Transcribiendo, en curso'],
    ['pendiente', 'Transcribiendo, pendiente'],
  ])('describe el estado %s con palabras para lectores de pantalla', async (estado, etiqueta) => {
    await renderPaso(estado);

    expect(screen.getByLabelText(etiqueta)).toBeOnTheScreen();
  });

  it('muestra el detalle y lo incluye en la descripción accesible', async () => {
    await renderPaso('pendiente', 'Cuando lo pidas');

    expect(screen.getByText('Cuando lo pidas')).toBeOnTheScreen();
    expect(screen.getByLabelText('Transcribiendo, pendiente, Cuando lo pidas')).toBeOnTheScreen();
  });
});
