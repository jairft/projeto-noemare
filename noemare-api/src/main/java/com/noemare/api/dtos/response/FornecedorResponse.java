package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.noemare.api.domain.Fornecedor;
import com.noemare.api.domain.enums.StatusFornecedor;

public record FornecedorResponse(
        Long id,
        String nome,
        BigDecimal saldoDevedorInvestimento, // 👉 NOVO
        BigDecimal saldoDevedorAdiantamento, // 👉 NOVO
        BigDecimal saldoCredor,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime dataCadastro,
        StatusFornecedor status
) {
    // 1. Construtor original (mantém para rotinas padrão)
    public FornecedorResponse(Fornecedor fornecedor) {
        this(
                fornecedor.getId(),
                fornecedor.getNome(),
                // ⚠️ Atenção: A sua classe 'Fornecedor' também precisa ter esses getters
                fornecedor.getSaldoDevedorInvestimento() != null ? fornecedor.getSaldoDevedorInvestimento() : BigDecimal.ZERO,
                fornecedor.getSaldoDevedorAdiantamento() != null ? fornecedor.getSaldoDevedorAdiantamento() : BigDecimal.ZERO,
                fornecedor.getSaldoCredor() != null ? fornecedor.getSaldoCredor() : BigDecimal.ZERO,
                fornecedor.getDataCadastro(),
                fornecedor.getStatus()
        );
    }

    // 2. Construtor para o Filtro por Ano 
    // 👉 Atualizado para receber os três saldos calculados na hora
    public FornecedorResponse(Fornecedor fornecedor, BigDecimal saldoInvestimentoAno, BigDecimal saldoAdiantamentoAno, BigDecimal saldoCredorAno) {
        this(
                fornecedor.getId(),
                fornecedor.getNome(),
                saldoInvestimentoAno != null ? saldoInvestimentoAno : BigDecimal.ZERO,
                saldoAdiantamentoAno != null ? saldoAdiantamentoAno : BigDecimal.ZERO,
                saldoCredorAno != null ? saldoCredorAno : BigDecimal.ZERO,
                fornecedor.getDataCadastro(),
                fornecedor.getStatus()
        );
    }
}