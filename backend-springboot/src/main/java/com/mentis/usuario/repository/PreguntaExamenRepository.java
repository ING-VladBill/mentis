package com.mentis.usuario.repository;

import com.mentis.usuario.entity.PreguntaExamen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PreguntaExamenRepository extends JpaRepository<PreguntaExamen, Long> {
    List<PreguntaExamen> findByExamenIdOrderByOrdenAsc(Long examenId);
    Optional<PreguntaExamen> findByIdAndExamenId(Long id, Long examenId);
}
