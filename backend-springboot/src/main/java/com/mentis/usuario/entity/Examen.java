package com.mentis.usuario.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** Tabla 'examenes' — esquema definido en Django (evaluaciones/models.py). */
@Entity
@Table(name = "examenes")
@Getter @Setter
public class Examen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "candidato_id", unique = true)
    private Candidato candidato;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vacante_id")
    private Vacante vacante;

    /** pendiente | generado | en_curso | finalizado | expirado */
    private String estado = "pendiente";

    @Column(name = "duracion_minutos")
    private Integer duracionMinutos = 45;

    @Column(name = "total_preguntas")
    private Integer totalPreguntas = 10;

    @Column(name = "fecha_generacion")
    private LocalDateTime fechaGeneracion;

    @Column(name = "fecha_inicio")
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(precision = 4, scale = 2)
    private BigDecimal nota;

    private Boolean aprobado;

    @OneToMany(mappedBy = "examen", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("orden ASC")
    private List<PreguntaExamen> preguntas = new ArrayList<>();
}
