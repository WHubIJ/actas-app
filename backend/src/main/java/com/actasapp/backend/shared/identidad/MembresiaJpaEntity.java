package com.actasapp.backend.shared.identidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Solo lectura: nada en el backend crea filas de `membresia` todavía (eso lo
 * hace el trigger de Postgres del alta en Supabase Auth, ver
 * V3__alta_perfil_organizacion.sql). Por eso no hay constructor público ni
 * dominio/puertos alrededor — es una consulta de infraestructura, no una
 * regla de negocio que proteger.
 */
@Entity
@Table(name = "membresia")
public class MembresiaJpaEntity {

    @Id
    private UUID id;

    @Column(name = "organizacion_id", nullable = false)
    private UUID organizacionId;

    @Column(name = "usuario_id", nullable = false)
    private UUID usuarioId;

    @Column(nullable = false)
    private String rol;

    @Column(name = "creada_en", nullable = false)
    private OffsetDateTime creadaEn;

    protected MembresiaJpaEntity() {} // requerido por JPA

    public UUID getId() { return id; }
    public UUID getOrganizacionId() { return organizacionId; }
    public UUID getUsuarioId() { return usuarioId; }
    public String getRol() { return rol; }
    public OffsetDateTime getCreadaEn() { return creadaEn; }
}
