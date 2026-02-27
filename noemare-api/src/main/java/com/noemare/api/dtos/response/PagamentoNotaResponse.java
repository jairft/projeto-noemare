package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.noemare.api.domain.PagamentoNota;

public record PagamentoNotaResponse(
        Long id,
        Long notaId,
        Long fornecedorId,
        BigDecimal valorBruto,
        BigDecimal valorDesconto,
        BigDecimal valorLiquido,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime dataPagamento,
        String observacao
) {
    public PagamentoNotaResponse(PagamentoNota pagamento) {
        this(
            pagamento.getId(),
            pagamento.getNota().getId(),
            pagamento.getFornecedor().getId(),
            pagamento.getValorBruto(),
            pagamento.getValorDesconto(),
            pagamento.getValorLiquido(),
            pagamento.getDataPagamento(),
            pagamento.getObservacao()
        );
    }
}