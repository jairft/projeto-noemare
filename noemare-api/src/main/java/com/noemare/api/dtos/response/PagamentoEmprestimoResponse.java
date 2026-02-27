package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.noemare.api.domain.PagamentoEmprestimo; // Atualizado

public record PagamentoEmprestimoResponse( // Atualizado
        Long id,
        Long emprestimoId, // Atualizado
        BigDecimal valor,
        String descricao,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime dataPagamento
) {
    public PagamentoEmprestimoResponse(PagamentoEmprestimo pagamento) { // Atualizado
        this(
            pagamento.getId(),
            pagamento.getEmprestimo().getId(), // Atualizado
            pagamento.getValor(),
            pagamento.getDescricao(),
            pagamento.getDataPagamento()
        );
    }
}