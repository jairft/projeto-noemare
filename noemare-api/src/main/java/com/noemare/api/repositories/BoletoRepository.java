package com.noemare.api.repositories;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.noemare.api.domain.Boleto;
import com.noemare.api.domain.enums.StatusBoleto;

public interface BoletoRepository extends JpaRepository<Boleto, Long> {
    
    // Busca boletos PENDENTES que vencem entre hoje e daqui a X dias
    List<Boleto> findByStatusAndDataVencimentoBetweenOrderByDataVencimentoAsc(
        StatusBoleto status, 
        LocalDate dataInicio, 
        LocalDate dataFim
    );
    
    // Busca boletos que já passaram da data e ainda estão PENDENTES
    List<Boleto> findByStatusAndDataVencimentoBefore(StatusBoleto status, LocalDate dataAtual);


    List<Boleto> findByStatusNotAndDataVencimentoLessThanEqualOrderByDataVencimentoAsc(
        StatusBoleto status, 
        LocalDate dataLimite
    );

    @Query("SELECT b FROM Boleto b WHERE YEAR(b.dataVencimento) = :ano ORDER BY b.dataVencimento DESC")
    List<Boleto> findAllByAno(@Param("ano") Integer ano);

    // Busca boletos para o sininho (Não Pagos, Vencendo até a data limite, e que sejam do ano filtrado)
    @Query("SELECT b FROM Boleto b WHERE b.status <> :statusPago AND b.dataVencimento <= :dataLimite AND YEAR(b.dataVencimento) = :ano ORDER BY b.dataVencimento ASC")
    List<Boleto> findNotificacoesPendentesPorAno(@Param("statusPago") StatusBoleto statusPago, @Param("dataLimite") LocalDate dataLimite, @Param("ano") Integer ano);
}