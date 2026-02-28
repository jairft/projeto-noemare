package com.noemare.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.noemare.api.domain.ConfiguracaoSistema;

public interface ConfiguracaoSistemaRepository extends JpaRepository<ConfiguracaoSistema, Long> {
}