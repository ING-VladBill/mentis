package com.mentis.usuario.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/** Tabla 'eventos_auditoria' — comportamiento sospechoso durante el examen. */
@Entity
@Table(name = "eventos_auditoria")
@Getter @Setter
public class EventoAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examen_id")
    private Examen examen;

    /** perdida_foco | cambio_ventana | copy_paste | click_derecho | devtools | inactividad | otro */
    private String tipo;

    /** baja | media | alta — nivel de riesgo para el dashboard de RRHH */
    private String severidad;

    @Column(columnDefinition = "longtext")
    private String detalle;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;
}
