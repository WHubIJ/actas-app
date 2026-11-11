import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { ChipsFiltro } from './ChipsFiltro';

const FILTROS = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'recientes', etiqueta: 'Recientes' },
  { id: 'fallidas', etiqueta: 'Fallidas' },
] as const;

const renderChips = (activo: (typeof FILTROS)[number]['id'], onSeleccionar = jest.fn()) =>
  render(
    <ThemeProvider initialPreference="light">
      <ChipsFiltro filtros={FILTROS} activo={activo} onSeleccionar={onSeleccionar} />
    </ThemeProvider>,
  );

describe('ChipsFiltro', () => {
  it('renderiza una pestaña por filtro y marca solo la activa', async () => {
    await renderChips('recientes');

    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Recientes' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Todas' })).not.toBeSelected();
    expect(screen.getByRole('tab', { name: 'Fallidas' })).not.toBeSelected();
  });

  it('llama a onSeleccionar con el id del chip pulsado', async () => {
    const onSeleccionar = jest.fn();
    await renderChips('todas', onSeleccionar);

    await fireEvent.press(screen.getByRole('tab', { name: 'Fallidas' }));

    expect(onSeleccionar).toHaveBeenCalledWith('fallidas');
  });
});
