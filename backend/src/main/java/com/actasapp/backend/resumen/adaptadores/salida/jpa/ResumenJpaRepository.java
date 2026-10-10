package com.actasapp.backend.resumen.adaptadores.salida.jpa;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ResumenJpaRepository extends JpaRepository<ResumenJpaEntity, UUID> {

    Optional<ResumenJpaEntity> findTopByReunionIdAndFormatoOrderByGeneradoEnDesc(UUID reunionId, FormatoArchivo formato);
}
