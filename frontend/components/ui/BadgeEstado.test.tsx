import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { lightColors } from '../../theme/tokens';
import { BadgeEstado } from './BadgeEstado';
import type { EstadoTranscripcion } from '../../src/types';

const renderConTema = (ui: React.ReactElement) => render(<ThemeProvider initialPreference="light">{ui}</ThemeProvider>);

describe('BadgeEstado', () => {
  // EN_PROCESO queda fuera de la tabla: monta un Animated.loop infinito que
  // no aporta nada a lo que se comprueba aquí (etiqueta y tono).
  const casos: ReadonlyArray<[Exclude<EstadoTranscripcion, 'EN_PROCESO'>, string, string]> = [
    ['COMPLETADA', 'Procesado por IA', lightColors.success],
    ['FALLIDA', 'Error', lightColors.danger],
    ['PENDIENTE', 'En cola', lightColors.text2],
  ];

  it.each(casos)('%s muestra "%s" con su color de tono', async (estado, etiqueta, color) => {
    await renderConTema(<BadgeEstado estado={estado} />);

    expect(screen.getByText(etiqueta)).toHaveStyle({ color });
  });

  it('EN_PROCESO muestra "Procesando" y deja de animarse al desmontar', async () => {
    const { unmount } = await renderConTema(<BadgeEstado estado="EN_PROCESO" />);

    expect(screen.getByText('Procesando')).toHaveStyle({ color: lightColors.brandStrong });
    await unmount();
  });
});
