package com.noemare.api.repositories;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.noemare.api.domain.LogLancamento;

@Repository
public interface LogLancamentoRepository extends JpaRepository<LogLancamento, Long> {

    @Query("SELECT l FROM LogLancamento l WHERE YEAR(l.dataHora) = :ano ORDER BY l.dataHora DESC")
    List<LogLancamento> findAllByAno(@Param("ano") Integer ano);

    @Modifying
    @Query("DELETE FROM LogLancamento l WHERE l.dataHora < :dataLimite") 
    void deletarLogsAntigos(@Param("dataLimite") LocalDateTime dataLimite);
}