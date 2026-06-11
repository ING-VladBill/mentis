package com.mentis.usuario.repository;

import com.mentis.usuario.entity.Vacante;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VacanteRepository extends JpaRepository<Vacante, Long> {
}
