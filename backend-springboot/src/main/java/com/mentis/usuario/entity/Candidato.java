package com.mentis.usuario.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tabla 'candidatos' — creada por Django.
 * Mapeamos SOLO las columnas que el módulo usuario necesita leer/actualizar.
 */
@Entity
@Table(name = "candidatos")
@Getter @Setter
public class Candidato {

    @Id
    private Long id;

    private String nombre;

    @Column(name = "apellido_paterno")
    private String apellidoPaterno;

    @Column(name = "apellido_materno")
    private String apellidoMaterno;

    private String email;

    private String estado;

    @Column(name = "cv_texto_extraido", columnDefinition = "longtext")
    private String cvTextoExtraido;

    @Column(name = "score_cv")
    private Integer scoreCv;

    @Column(name = "score_examen", precision = 4, scale = 2)
    private BigDecimal scoreExamen;

    @Column(name = "examen_aprobado")
    private Boolean examenAprobado;

    @Column(name = "fecha_examen")
    private LocalDateTime fechaExamen;

    @Column(name = "score_entrevista", precision = 4, scale = 2)
    private BigDecimal scoreEntrevista;

    @Column(name = "score_final", precision = 5, scale = 2)
    private BigDecimal scoreFinal;

    @Column(name = "posicion_ranking")
    private Integer posicionRanking;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vacante_id")
    private Vacante vacante;

    @Transient
    public String getNombreCompleto() {
        StringBuilder sb = new StringBuilder(nombre != null ? nombre : "");
        if (apellidoPaterno != null && !apellidoPaterno.isBlank()) sb.append(" ").append(apellidoPaterno);
        if (apellidoMaterno != null && !apellidoMaterno.isBlank()) sb.append(" ").append(apellidoMaterno);
        return sb.toString().trim();
    }
}
