package com.noemare.api.repositories;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.noemare.api.domain.NotaFornecedor;
import com.noemare.api.domain.enums.StatusNota;
import com.noemare.api.dtos.response.ProducaoItemResumoResponse;

@Repository
public interface NotaFornecedorRepository extends JpaRepository<NotaFornecedor, Long> {

    @Query("SELECT SUM(n.valorTotal - n.valorPago) FROM NotaFornecedor n WHERE n.status != 'PAGA'")
    BigDecimal somarTotalPendente();

    long countByStatusNot(StatusNota status);

    boolean existsByFornecedorId(Long fornecedorId);

    @Query("SELECT DISTINCT n FROM NotaFornecedor n " +
       "LEFT JOIN FETCH n.itens i " +
       "LEFT JOIN FETCH i.produto " +
       "WHERE YEAR(n.dataNota) = :ano " +
       "AND (cast(:dataInicio as timestamp) IS NULL OR n.dataNota >= :dataInicio) " +
       "AND (cast(:dataFim as timestamp) IS NULL OR n.dataNota <= :dataFim) " +
       "ORDER BY n.dataNota DESC")
    List<NotaFornecedor> buscarHistoricoFiltrado(
        @Param("ano") Integer ano, 
        @Param("dataInicio") LocalDateTime dataInicio, 
        @Param("dataFim") LocalDateTime dataFim
    );

    @Query("SELECT DISTINCT n FROM NotaFornecedor n " +
           "LEFT JOIN FETCH n.itens i " +
           "LEFT JOIN FETCH i.produto " +
           "WHERE YEAR(n.dataNota) = :ano " +
           "ORDER BY n.dataNota DESC")
    List<NotaFornecedor> findAllByAno(@Param("ano") Integer ano);

    @Query("SELECT SUM(n.valorTotal - n.valorPago) FROM NotaFornecedor n WHERE n.status <> 'PAGA' AND YEAR(n.dataNota) = :ano")
    BigDecimal somarTotalPendentePorAno(@Param("ano") Integer ano);

    @Query("SELECT COUNT(n) FROM NotaFornecedor n WHERE n.status <> 'PAGA' AND YEAR(n.dataNota) = :ano")
    long countPendentesPorAno(@Param("ano") Integer ano);

    @Query("SELECT SUM(n.valorTotal - n.valorPago) FROM NotaFornecedor n " +
           "WHERE n.fornecedor.id = :fornecedorId AND n.status <> 'PAGA' AND YEAR(n.dataNota) = :ano")
    BigDecimal somarTotalPendentePorFornecedorEAno(@Param("fornecedorId") Long fornecedorId, @Param("ano") Integer ano);

    @Query("SELECT SUM(n.valorTotal) FROM NotaFornecedor n WHERE n.fornecedor.id = :fornecedorId AND YEAR(n.dataNota) = :ano")
    BigDecimal somarTotalCompradoPorFornecedorEAno(@Param("fornecedorId") Long fornecedorId, @Param("ano") Integer ano);

    @Query("SELECT SUM(n.valorTotal) FROM NotaFornecedor n WHERE YEAR(n.dataNota) = :ano")
    BigDecimal somarTotalNotasPorAno(@Param("ano") Integer ano);

    @Query("SELECT MONTH(n.dataNota) as mes, SUM(n.totalKg) as totalKg " +
       "FROM NotaFornecedor n " +
       "WHERE YEAR(n.dataNota) = :ano " +
       "GROUP BY MONTH(n.dataNota)")
       List<Object[]> somarVolumePorMesNoAno(@Param("ano") Integer ano);

    @Query("SELECT new com.noemare.api.dtos.response.ProducaoItemResumoResponse(" +
           "p.nome, p.tipo, p.tamanho, SUM(i.quantidadeKg)) " +
           "FROM NotaItem i " +
           "JOIN i.nota n " +
           "JOIN i.produto p " +
           "WHERE n.fornecedor.id = :fornecedorId AND YEAR(n.dataNota) = :ano " +
           "GROUP BY p.nome, p.tipo, p.tamanho")
    List<ProducaoItemResumoResponse> buscarResumoProducaoPorFornecedorEAno(@Param("fornecedorId") Long fornecedorId, @Param("ano") Integer ano);

    @Query("SELECT new com.noemare.api.dtos.response.ProducaoItemResumoResponse(" +
           "p.nome, p.tipo, p.tamanho, SUM(i.quantidadeKg)) " +
           "FROM NotaItem i " +
           "JOIN i.nota n " +
           "JOIN i.produto p " +
           "WHERE n.fornecedor.id = :fornecedorId " +
           "GROUP BY p.nome, p.tipo, p.tamanho")
    List<ProducaoItemResumoResponse> buscarResumoProducaoPorFornecedor(@Param("fornecedorId") Long fornecedorId);

    @Query("SELECT SUM(n.valorTotal - n.valorPago) FROM NotaFornecedor n " +
           "WHERE n.fornecedor.id = :fornecedorId " +
           "AND n.status <> 'PAGA' " +
           "AND YEAR(n.dataNota) = :ano")
    BigDecimal somarSaldoCredorPorFornecedorEAno(
        @Param("fornecedorId") Long fornecedorId, 
        @Param("ano") Integer ano
    );

    // 👉 NOVO: Traz todas as notas do fornecedor já com os itens e produtos de uma só vez (Evita Lentidão/N+1)
    @Query("SELECT DISTINCT n FROM NotaFornecedor n " +
           "LEFT JOIN FETCH n.itens i " +
           "LEFT JOIN FETCH i.produto " +
           "WHERE n.fornecedor.id = :fornecedorId " +
           "ORDER BY n.dataNota DESC")
    List<NotaFornecedor> findHistoricoCompletoByFornecedorId(@Param("fornecedorId") Long fornecedorId);

    boolean existsByNumeroNota(String numeroNota);
    
    boolean existsByNumeroNotaAndIdNot(String numeroNota, Long id);
}