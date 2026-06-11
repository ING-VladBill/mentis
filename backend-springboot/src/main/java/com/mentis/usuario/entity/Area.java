package com.mentis.usuario.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Tabla 'areas' — creada y gestionada por Django. Solo lectura desde aquí. */
@Entity
@Table(name = "areas")
@Getter @Setter
public class Area {

    @Id
    private Long id;

    private String nombre;

    @Column(name = "codigo_corto")
    private String codigoCorto;

    @Column(name = "instruccion_ia", columnDefinition = "longtext")
    private String instruccionIa;
}
