package com.noemare.api.repositories;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.noemare.api.domain.Emprestimo;
import com.noemare.api.domain.enums.StatusEmprestimo;
import com.noemare.api.domain.enums.TipoEmprestimo;

public interface EmprestimoRepository extends JpaRepository<Emprestimo, Long> {

    // Verifica se existe qualquer adiantamento ou emprestimo para este fornecedor
    boolean existsByFornecedorId(Long fornecedorId);

    // 1. Usado no Modal de Baixa (Geral)
    @Query("""
        SELECT COALESCE(SUM(e.saldoRestante), 0) 
        FROM Emprestimo e 
        WHERE e.fornecedor.id = :fornecedorId 
        AND e.tipo = :tipo 
        AND e.status = 'ABERTO'
    """)
    BigDecimal somarSaldoRestantePorFornecedorETipo(
        @Param("fornecedorId") Long fornecedorId, 
        @Param("tipo") TipoEmprestimo tipo
    );

    // 2. Usado na Lógica FIFO
    List<Emprestimo> findByFornecedorIdAndTipoAndStatusOrderByDataEmprestimoAsc(
        Long fornecedorId, TipoEmprestimo tipo, StatusEmprestimo status
    );

    // 3. Usado no DashboardService (Totais Globais)
    @Query("SELECT COALESCE(SUM(e.saldoRestante), 0) FROM Emprestimo e WHERE e.tipo = :tipo AND e.status = :status")
    BigDecimal somarSaldoPorTipoEStatus(
        @Param("tipo") TipoEmprestimo tipo, 
        @Param("status") StatusEmprestimo status
    );

    // 4. Atalho rápido para adiantamentos ativos
    @Query("SELECT COALESCE(SUM(e.saldoRestante), 0) FROM Emprestimo e WHERE e.tipo = 'ADIANTAMENTO' AND e.status = 'ABERTO'")
    BigDecimal somarAdiantamentosAtivos();

    // 5. Soma TUDO o que ele deve (Emprestimo + Adiantamento) que ainda está ABERTO no ano
    @Query("""
        SELECT COALESCE(SUM(e.saldoRestante), 0) 
        FROM Emprestimo e 
        WHERE e.fornecedor.id = :fornecedorId 
        AND YEAR(e.dataEmprestimo) = :ano 
        AND e.status = 'ABERTO'
    """)
    BigDecimal somarSaldoDevedorPorFornecedorEAno(
        @Param("fornecedorId") Long fornecedorId, 
        @Param("ano") Integer ano
    );

    // 6. Busca o saldo restante (Emprestimo ou Adiantamento) filtrando pelo ANO
    @Query("""
        SELECT COALESCE(SUM(e.saldoRestante), 0) 
        FROM Emprestimo e 
        WHERE e.fornecedor.id = :fornecedorId 
        AND e.tipo = :tipo
        AND YEAR(e.dataEmprestimo) = :ano 
        AND e.status = 'ABERTO'
    """)
    BigDecimal somarSaldoRestantePorFornecedorETipoEAno(
        @Param("fornecedorId") Long fornecedorId, 
        @Param("tipo") TipoEmprestimo tipo,
        @Param("ano") Integer ano
    );

    // 👉 7. NOVO: Busca o valor que JÁ FOI PAGO filtrando pelo ANO (Safra)
    @Query("""
        SELECT COALESCE(SUM(e.valorTotal - e.saldoRestante), 0) 
        FROM Emprestimo e 
        WHERE e.fornecedor.id = :fornecedorId 
        AND e.tipo = :tipo
        AND YEAR(e.dataEmprestimo) = :ano
    """)
    BigDecimal somarValorPagoPorFornecedorETipoEAno(
        @Param("fornecedorId") Long fornecedorId, 
        @Param("tipo") TipoEmprestimo tipo,
        @Param("ano") Integer ano
    );

    // 8. Usado no RelatorioService (para ver a dívida total histórica)
    @Query("""
        SELECT COALESCE(SUM(e.saldoRestante), 0) 
        FROM Emprestimo e 
        WHERE e.fornecedor.id = :fornecedorId 
        AND e.status = 'ABERTO'
    """)
    BigDecimal somarSaldoDevedorTotalPorFornecedor(@Param("fornecedorId") Long fornecedorId);
    
    @Query("SELECT COALESCE(SUM(e.valorTotal - e.saldoRestante), 0) FROM Emprestimo e WHERE e.fornecedor.id = :fornecedorId AND e.tipo = :tipo")
    BigDecimal somarValorPagoPorFornecedorETipo(@Param("fornecedorId") Long fornecedorId, @Param("tipo") TipoEmprestimo tipo);
}