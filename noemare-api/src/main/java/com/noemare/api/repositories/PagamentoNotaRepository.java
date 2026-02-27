package com.noemare.api.repositories;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.noemare.api.domain.PagamentoNota;

@Repository
public interface PagamentoNotaRepository extends JpaRepository<PagamentoNota, Long> {
    List<PagamentoNota> findByNotaId(Long notaId);

    // 1. Soma o valor total (Bruto) de pagamentos a partir de uma data
    @Query("SELECT SUM(p.valorBruto) FROM PagamentoNota p WHERE p.dataPagamento >= :data")
    BigDecimal somarPagamentosAPartirDe(@Param("data") LocalDateTime data);

    // 2. 👉 AJUSTADO: Soma o Valor Bruto (Dinheiro + Abatimentos) para o Card do Topo do Relatório
    // Antes usava valorLiquido, por isso os cartões do topo não batiam com o desktop
    @Query("SELECT COALESCE(SUM(p.valorBruto), 0) FROM PagamentoNota p WHERE YEAR(p.dataPagamento) = :ano")
    BigDecimal somarPagamentosPorAno(@Param("ano") Integer ano);

    // 3. 👉 AJUSTADO: Soma o Valor Bruto para a linha do fornecedor na tabela
    // Isso fará o "Total Pago" do Carlos subir de R$ 500 para R$ 2.000
    @Query("""
        SELECT COALESCE(SUM(p.valorBruto), 0) 
        FROM PagamentoNota p 
        WHERE p.fornecedor.id = :fornecedorId 
        AND YEAR(p.dataPagamento) = :ano
    """)
    BigDecimal somarTotalPagoPorFornecedorEAno(@Param("fornecedorId") Long fornecedorId, @Param("ano") Integer ano);
}