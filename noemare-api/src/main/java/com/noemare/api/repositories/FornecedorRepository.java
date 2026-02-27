package com.noemare.api.repositories;

import java.math.BigDecimal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.noemare.api.domain.Fornecedor;

@Repository
public interface FornecedorRepository extends JpaRepository<Fornecedor, Long> {
    
    // 👉 ATUALIZADO: Agora ele soma o total de Investimentos + o total de Adiantamentos
    @Query("SELECT COALESCE(SUM(f.saldoDevedorInvestimento), 0) + COALESCE(SUM(f.saldoDevedorAdiantamento), 0) FROM Fornecedor f")
    BigDecimal somarTodosSaldosDevedores();
    
}