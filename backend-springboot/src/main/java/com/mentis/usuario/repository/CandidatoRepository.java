package com.mentis.usuario.repository;

import com.mentis.usuario.entity.Candidato;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CandidatoRepository extends JpaRepository<Candidato, Long> {

    /** Candidatos activos de una vacante, para recalcular el ranking. */
    @Query("""
        SELECT c FROM Candidato c
        WHERE c.vacante.id = :vacanteId
          AND c.estado NOT IN ('cv_rechazado', 'examen_rechazado', 'descartado')
        ORDER BY c.scoreFinal DESC NULLS LAST, c.scoreCv DESC NULLS LAST
    """)
    List<Candidato> rankingDeVacante(@Param("vacanteId") Long vacanteId);
}
