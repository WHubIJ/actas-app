package com.actasapp.backend.shared.identidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

/** Solo lectura: lo crea el trigger del alta en Supabase Auth (V3__alta_perfil_organizacion.sql). */
@Entity
@Table(name = "perfil")
public class PerfilJpaEntity {

    @Id
    @Column(name = "usuario_id")
    private UUID usuarioId;

    private String nombre;
    private String telefono;

    protected PerfilJpaEntity() {} // requerido por JPA

    public UUID getUsuarioId() { return usuarioId; }
    public String getNombre() { return nombre; }
    public String getTelefono() { return telefono; }
}
