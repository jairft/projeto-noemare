package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.noemare.api.domain.PagamentoNota;

public record HistoricoPagamentoResponse(
        Long id,
        BigDecimal valorTotalBaixado,
        BigDecimal valorDinheiro,     
        BigDecimal valorAbatidoInvestimento, // NOVO
        BigDecimal valorAbatidoAdiantamento, // NOVO
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime dataPagamento,
        String observacao
) {
    public HistoricoPagamentoResponse(PagamentoNota p) {
        this(
                p.getId(),
                p.getValorBruto(), 
                // Dinheiro = Total Baixado - Total de Descontos
                p.getValorBruto().subtract(p.getValorDesconto() != null ? p.getValorDesconto() : BigDecimal.ZERO), 
                
                // Retorna os valores separados (com proteção contra null para dados antigos)
                p.getValorAbatidoInvestimento() != null ? p.getValorAbatidoInvestimento() : BigDecimal.ZERO,
                p.getValorAbatidoAdiantamento() != null ? p.getValorAbatidoAdiantamento() : BigDecimal.ZERO,
                
                p.getDataPagamento(), 
                p.getObservacao()
        );
    }
}