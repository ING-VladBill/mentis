package com.mentis.usuario.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Tabla 'preguntas_examen' — esquema definido en Django. */
@Entity
@Table(name = "preguntas_examen")
@Getter @Setter
public class PreguntaExamen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examen_id")
    private Examen examen;

    private Integer orden;

    /** multiple | abierta */
    private String tipo;

    private String categoria;

    @Column(columnDefinition = "longtext")
    private String enunciado;

    /** JSON serializado: ["A","B","C","D"] (vacío si es abierta) */
    @Column(columnDefinition = "longtext")
    private String opciones;

    /** NUNCA exponer al front. */
    @Column(name = "respuesta_correcta", columnDefinition = "longtext")
    private String respuestaCorrecta;

    private Integer puntos = 2;

    @Column(name = "respuesta_candidato", columnDefinition = "longtext")
    private String respuestaCandidato;

    @Column(name = "respondida_en")
    private LocalDateTime respondidaEn;

    @Column(name = "es_correcta")
    private Boolean esCorrecta;

    @Column(name = "puntos_obtenidos", precision = 3, scale = 1)
    private BigDecimal puntosObtenidos;

    @Column(name = "feedback_ia", columnDefinition = "longtext")
    private String feedbackIa;
}
