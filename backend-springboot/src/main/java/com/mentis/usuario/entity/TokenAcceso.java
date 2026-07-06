package com.mentis.usuario.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * Tabla 'tokens_acceso' — creada por Django.
 * OJO: Django guarda los UUID como char(32) SIN guiones.
 */
@Entity
@Table(name = "tokens_acceso")
@Getter @Setter
public class TokenAcceso {

    @Id
    private Long id;

    @Column(name = "token", length = 32, unique = true)
    private String token;

    private String tipo;
    private Boolean usado;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_expiracion")
    private LocalDateTime fechaExpiracion;

    @Column(name = "fecha_uso")
    private LocalDateTime fechaUso;

    @Column(name = "ip_uso")
    private String ipUso;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidato_id")
    private Candidato candidato;
}
