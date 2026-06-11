package com.mentis.usuario.repository;

import com.mentis.usuario.entity.Examen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExamenRepository extends JpaRepository<Examen, Long> {
    Optional<Examen> findByCandidatoId(Long candidatoId);
}
