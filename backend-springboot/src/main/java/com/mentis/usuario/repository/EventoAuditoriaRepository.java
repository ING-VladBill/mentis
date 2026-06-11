package com.mentis.usuario.repository;

import com.mentis.usuario.entity.EventoAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventoAuditoriaRepository extends JpaRepository<EventoAuditoria, Long> {
    List<EventoAuditoria> findByExamenIdOrderByTimestampAsc(Long examenId);
    long countByExamenId(Long examenId);
}
