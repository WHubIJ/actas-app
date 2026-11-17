package com.actasapp.backend.grabacion.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de la regla de negocio de Reunion. Dominio puro: sin Spring, sin JPA,
 * sin @SpringBootTest.
 */
class ReunionTest {

    private Reunion nuevaReunion() {
        return new Reunion(UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now());
    }

    private ClipAudio nuevoClip(Reunion reunion, int orden) {
        return new ClipAudio(UUID.randomUUID(), reunion.getId(), orden);
    }

    @Test
    void noSePuedeCrearSinOrganizacion() {
        assertThrows(IllegalArgumentException.class,
                () -> new Reunion(UUID.randomUUID(), null, null, LocalDate.now()));
    }

    @Test
    void seCreaNoFinalizadaYSinClips() {
        Reunion reunion = nuevaReunion();

        assertFalse(reunion.isFinalizada());
        assertTrue(reunion.getClips().isEmpty());
    }

    @Test
    void finalizarSinClipsLanzaExcepcion() {
        Reunion reunion = nuevaReunion();

        assertThrows(IllegalStateException.class, reunion::finalizar);
        assertFalse(reunion.isFinalizada());
    }

    @Test
    void finalizarConClipsSinNingunoCompletadoLanzaExcepcion() {
        Reunion reunion = nuevaReunion();
        ClipAudio clip = nuevoClip(reunion, 1);
        clip.marcarError();
        reunion.agregarClip(clip);

        assertThrows(IllegalStateException.class, reunion::finalizar);
        assertFalse(reunion.isFinalizada());
    }

    @Test
    void finalizarConAlMenosUnClipCompletadoMarcaLaReunion() {
        Reunion reunion = nuevaReunion();
        ClipAudio clip = nuevoClip(reunion, 1);
        clip.marcarSubidaCompletada(reunion.getId() + "/clip-1.mp3", 120);
        reunion.agregarClip(clip);

        reunion.finalizar();

        assertTrue(reunion.isFinalizada());
    }

    @Test
    void reconstruirNoAplicaLasReglasDeCreacion() {
        // A diferencia de finalizar(), reconstruir() viene de BD y puede
        // representar una reunión finalizada sin clips completados persistidos
        // en este objeto (p. ej. si solo se cargó la cabecera).
        Reunion reunion = Reunion.reconstruir(UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now(), true, null, List.of());

        assertTrue(reunion.isFinalizada());
        assertTrue(reunion.getClips().isEmpty());
    }

    @Test
    void agregarClipSeReflejaEnGetClips() {
        Reunion reunion = nuevaReunion();
        ClipAudio clip = nuevoClip(reunion, 1);

        reunion.agregarClip(clip);

        assertEquals(1, reunion.getClips().size());
        assertSame(clip, reunion.getClips().get(0));
    }

    @Test
    void getClipsDevuelveUnaCopiaInmutable() {
        Reunion reunion = nuevaReunion();
        reunion.agregarClip(nuevoClip(reunion, 1));

        assertThrows(UnsupportedOperationException.class,
                () -> reunion.getClips().add(nuevoClip(reunion, 2)));
    }

    @Test
    void sinTituloNiParticipantesQuedanVaciosNoNulos() {
        Reunion reunion = nuevaReunion();

        assertNull(reunion.getTitulo());
        assertTrue(reunion.getParticipantes().isEmpty());
    }

    @Test
    void tituloEnBlancoSeNormalizaANulo() {
        Reunion reunion = new Reunion(UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now(), "   ", List.of());

        assertNull(reunion.getTitulo());
    }

    @Test
    void tituloYParticipantesSeRecortanAlCrear() {
        Reunion reunion = new Reunion(UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now(),
                "  Junta mensual  ", List.of(" Ana ", "", "  ", "Pedro"));

        assertEquals("Junta mensual", reunion.getTitulo());
        assertEquals(List.of("Ana", "Pedro"), reunion.getParticipantes());
    }

    @Test
    void getParticipantesDevuelveUnaListaInmutable() {
        Reunion reunion = new Reunion(UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now(), null, List.of("Ana"));

        assertThrows(UnsupportedOperationException.class, () -> reunion.getParticipantes().add("Pedro"));
    }

    // --- Reuniones programadas (ADR-008) ---

    private Reunion programadaPara(LocalDate fecha) {
        return Reunion.programar(UUID.randomUUID(), UUID.randomUUID(), null, fecha, LocalTime.of(19, 30),
                "Salón anexo", "Reunión de diáconos", List.of("Ana"));
    }

    @Test
    void unaReunionNormalNoEstaProgramada() {
        assertFalse(nuevaReunion().estaProgramada());
        assertFalse(nuevaReunion().isProgramada());
    }

    @Test
    void programarCreaUnaReunionProgramadaSinFinalizar() {
        Reunion reunion = programadaPara(LocalDate.now().plusDays(3));

        assertTrue(reunion.estaProgramada());
        assertFalse(reunion.isFinalizada());
        assertEquals(LocalTime.of(19, 30), reunion.getHora());
        assertEquals("Salón anexo", reunion.getLugar());
        assertEquals("Reunión de diáconos", reunion.getTitulo());
    }

    @Test
    void sePuedeProgramarParaHoy() {
        assertTrue(programadaPara(LocalDate.now()).estaProgramada());
    }

    @Test
    void noSePuedeProgramarEnElPasado() {
        assertThrows(IllegalArgumentException.class, () -> programadaPara(LocalDate.now().minusDays(1)));
    }

    @Test
    void noSePuedeProgramarSinFecha() {
        assertThrows(IllegalArgumentException.class, () -> programadaPara(null));
    }

    @Test
    void horaYLugarSonOpcionalesYElLugarEnBlancoSeNormalizaANulo() {
        Reunion reunion = Reunion.programar(UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now().plusDays(1),
                null, "   ", null, null);

        assertNull(reunion.getHora());
        assertNull(reunion.getLugar());
        assertNull(reunion.getTitulo());
        assertTrue(reunion.getParticipantes().isEmpty());
    }

    @Test
    void reprogramarSustituyeLaConvocatoriaEntera() {
        Reunion reunion = programadaPara(LocalDate.now().plusDays(3));
        LocalDate nuevaFecha = LocalDate.now().plusDays(10);

        reunion.reprogramar(nuevaFecha, null, " Sala 2 ", "  Junta  ", List.of("Pedro", " "));

        assertEquals(nuevaFecha, reunion.getFecha());
        assertNull(reunion.getHora());
        assertEquals("Sala 2", reunion.getLugar());
        assertEquals("Junta", reunion.getTitulo());
        assertEquals(List.of("Pedro"), reunion.getParticipantes());
        assertTrue(reunion.estaProgramada());
    }

    @Test
    void reprogramarAlPasadoLanzaExcepcionYNoCambiaNada() {
        Reunion reunion = programadaPara(LocalDate.now().plusDays(3));
        LocalDate fechaOriginal = reunion.getFecha();

        assertThrows(IllegalArgumentException.class,
                () -> reunion.reprogramar(LocalDate.now().minusDays(1), null, null, "Otro", List.of()));

        assertEquals(fechaOriginal, reunion.getFecha());
        assertEquals("Reunión de diáconos", reunion.getTitulo());
    }

    @Test
    void unaReunionNormalNoSePuedeReprogramar() {
        Reunion reunion = nuevaReunion();

        assertThrows(IllegalStateException.class,
                () -> reunion.reprogramar(LocalDate.now().plusDays(1), null, null, null, List.of()));
    }

    @Test
    void unaProgramadaYaGrabadaDejaDeEstarProgramadaYNoSeReprograma() {
        Reunion reunion = programadaPara(LocalDate.now());
        ClipAudio clip = nuevoClip(reunion, 1);
        clip.marcarSubidaCompletada(reunion.getId() + "/clip-1.m4a", 60);
        reunion.agregarClip(clip);

        reunion.finalizar();

        assertTrue(reunion.isFinalizada());
        assertTrue(reunion.isProgramada()); // dato histórico: nació convocada
        assertFalse(reunion.estaProgramada());
        assertThrows(IllegalStateException.class,
                () -> reunion.reprogramar(LocalDate.now().plusDays(1), null, null, null, List.of()));
    }

    @Test
    void reconstruirRespetaProgramadaHoraYLugarSinValidarLaFecha() {
        // Una programada del mes pasado que nunca se grabó sigue en BD: leerla no puede fallar.
        Reunion reunion = Reunion.reconstruir(UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now().minusMonths(1),
                LocalTime.of(10, 0), "Sala 1", true, false, "Antigua", List.of());

        assertTrue(reunion.estaProgramada());
        assertEquals(LocalTime.of(10, 0), reunion.getHora());
        assertEquals("Sala 1", reunion.getLugar());
    }
}
