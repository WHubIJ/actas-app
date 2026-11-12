package com.actasapp.backend.grabacion.servicio;

import com.actasapp.backend.grabacion.puertos.salida.AlmacenamientoPuerto;
import com.actasapp.backend.grabacion.puertos.salida.ReunionRepositorioPuerto;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.context.ApplicationEventPublisher;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/** Solo el borrado; mocks de los puertos de salida, sin Spring. */
class GestorGrabacionServiceTest {

    private final ReunionRepositorioPuerto repositorio = mock(ReunionRepositorioPuerto.class);
    private final AlmacenamientoPuerto almacenamiento = mock(AlmacenamientoPuerto.class);
    private final GestorGrabacionService servicio =
            new GestorGrabacionService(repositorio, almacenamiento, mock(ApplicationEventPublisher.class));

    private final UUID reunionId = UUID.randomUUID();

    @Test
    void eliminarBorraLaFilaYDespuesElAudio() {
        servicio.eliminarReunion(reunionId);

        InOrder orden = inOrder(repositorio, almacenamiento);
        orden.verify(repositorio).eliminar(reunionId);
        orden.verify(almacenamiento).eliminarAudios(reunionId);
    }

    @Test
    void unFalloDeStorageNoImpideBorrarLaReunion() {
        doThrow(new RuntimeException("Storage caído")).when(almacenamiento).eliminarAudios(reunionId);

        assertDoesNotThrow(() -> servicio.eliminarReunion(reunionId));
        verify(repositorio).eliminar(reunionId);
    }
}
