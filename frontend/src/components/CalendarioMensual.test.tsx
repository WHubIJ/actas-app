import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { CalendarioMensual } from './CalendarioMensual';
import { eventosPorDia } from '../utils/calendario';
import type { ActaResumen, ReunionProgramada } from '../types';

const acta: ActaResumen = {
  id: 'a1',
  titulo: 'Junta',
  fecha: '20 noviembre 2026',
  fechaIso: '2026-11-20',
  duracionMinutos: 30,
  participantes: [],
  estadoTranscripcion: 'COMPLETADA',
};

const programada: ReunionProgramada = {
  id: 'p1',
  titulo: 'Diáconos',
  fechaIso: '2026-11-25',
  hora: '19:30',
  lugar: null,
  participantes: [],
};

// Tema fijo en claro y `await render`, como en el resto de tests de componentes.
async function pintar(props: Partial<React.ComponentProps<typeof CalendarioMensual>> = {}) {
  const onSeleccionar = jest.fn();
  const onCambiarMes = jest.fn();
  await render(
    <ThemeProvider initialPreference="light">
      <CalendarioMensual
        mes={{ anio: 2026, mes: 10 }}
        seleccionado="2026-11-14"
        hoyIso="2026-11-14"
        eventos={eventosPorDia([acta], [programada])}
        onSeleccionar={onSeleccionar}
        onCambiarMes={onCambiarMes}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onSeleccionar, onCambiarMes };
}

describe('CalendarioMensual', () => {
  it('muestra el mes y cuenta las reuniones de cada día en la etiqueta accesible', async () => {
    await pintar();
    expect(screen.getByText('Noviembre 2026')).toBeTruthy();
    expect(screen.getByLabelText('viernes, 20 de noviembre de 2026, 1 reunión')).toBeTruthy();
    expect(screen.getByLabelText('miércoles, 25 de noviembre de 2026, 1 reunión')).toBeTruthy();
    expect(screen.getByLabelText('sábado, 14 de noviembre de 2026, sin reuniones')).toBeTruthy();
  });

  it('al pulsar un día del mes avisa con su fecha ISO; los de relleno no se pulsan', async () => {
    const { onSeleccionar } = await pintar();
    await fireEvent.press(screen.getByLabelText('viernes, 20 de noviembre de 2026, 1 reunión'));
    expect(onSeleccionar).toHaveBeenCalledWith('2026-11-20');

    const relleno = screen.getByLabelText('lunes, 26 de octubre de 2026, sin reuniones');
    expect(relleno.props.accessibilityState.disabled).toBe(true);
  });

  it('las flechas cambian de mes', async () => {
    const { onCambiarMes } = await pintar();
    expect(screen.queryByText('Hoy')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Mes siguiente'));
    expect(onCambiarMes).toHaveBeenCalledWith({ anio: 2026, mes: 11 });
  });

  it('"Hoy" solo aparece fuera del mes actual y vuelve a él', async () => {
    const { onSeleccionar, onCambiarMes: cambiar } = await pintar({ mes: { anio: 2027, mes: 0 } });
    await fireEvent.press(screen.getByText('Hoy'));
    expect(cambiar).toHaveBeenCalledWith({ anio: 2026, mes: 10 });
    expect(onSeleccionar).toHaveBeenCalledWith('2026-11-14');
  });
});
