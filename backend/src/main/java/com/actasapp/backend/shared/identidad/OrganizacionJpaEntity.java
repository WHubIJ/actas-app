package com.actasapp.backend.shared.identidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Solo lectura: nada en el backend crea organizaciones todavía (lo hace el trigger del alta, ver ADR-005). */
@Entity
@Table(name = "organizacion")
public class OrganizacionJpaEntity {

    @Id
    private UUID id;

    private String nombre;
    private String plan;

    @Column(name = "creada_en")
    private OffsetDateTime creadaEn;

    protected OrganizacionJpaEntity() {} // requerido por JPA

    public UUID getId() { return id; }
    public String getNombre() { return nombre; }
    public String getPlan() { return plan; }
    public OffsetDateTime getCreadaEn() { return creadaEn; }
}
