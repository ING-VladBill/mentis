package com.mentis.usuario.repository;

import com.mentis.usuario.entity.TokenAcceso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenAccesoRepository extends JpaRepository<TokenAcceso, Long> {

    /** El token llega con guiones desde la URL; en la BD está sin guiones. */
    Optional<TokenAcceso> findByToken(String tokenSinGuiones);
}
