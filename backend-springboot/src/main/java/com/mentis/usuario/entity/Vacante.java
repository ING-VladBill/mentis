package com.mentis.usuario.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

/** Tabla 'vacantes' — creada por Django. Solo lectura desde el módulo usuario. */
@Entity
@Table(name = "vacantes")
@Getter @Setter
public class Vacante {

    @Id
    private Long id;

    private String codigo;
    private String titulo;

    @Column(columnDefinition = "longtext")
    private String descripcion;

    @Column(columnDefinition = "longtext")
    private String requisitos;

    @Column(columnDefinition = "longtext")
    private String habilidades;

    @Column(columnDefinition = "longtext")
    private String tecnologias;

    @Column(name = "conocimientos_especificos", columnDefinition = "longtext")
    private String conocimientosEspecificos;

    @Column(name = "nivel_experiencia")
    private String nivelExperiencia;

    @Column(name = "anios_experiencia")
    private Integer aniosExperiencia;

    @Column(name = "nota_minima_examen", precision = 4, scale = 2)
    private BigDecimal notaMinimaExamen;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "area_id")
    private Area area;
}
