package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.noemare.api.domain.NotaFornecedor;

public record HistoricoNotaResponse(
    Long id,
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime dataNota,
    String fornecedorNome,
    BigDecimal valorTotal,
    String status,
    List<HistoricoNotaItemResponse> itens // Lista de pescados embutida
) {
    public HistoricoNotaResponse(NotaFornecedor nota) {
        this(
            nota.getId(),
            nota.getDataNota(),
            nota.getFornecedor() != null ? nota.getFornecedor().getNome() : "Fornecedor Removido",
            nota.getValorTotal(),
            nota.getStatus().name(),
            nota.getItens().stream().map(HistoricoNotaItemResponse::new).toList()
        );
    }
}