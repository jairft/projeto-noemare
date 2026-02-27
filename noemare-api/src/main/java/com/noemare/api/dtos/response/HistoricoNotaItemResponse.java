package com.noemare.api.dtos.response;

import java.math.BigDecimal; // Ajuste o import para a sua entidade de Item
import com.noemare.api.domain.NotaItem;

public record HistoricoNotaItemResponse(
    String produtoNome,
    String tipo,     // A antiga "especie" que você já ajustou
    String tamanho,
    BigDecimal quantidadeKg,
    BigDecimal valorUnitario,
    BigDecimal valorTotal
) {
    public HistoricoNotaItemResponse(NotaItem item) {
        this(
            item.getProduto().getNome(),
            item.getProduto().getTipo(),
            item.getProduto().getTamanho(),
            item.getQuantidadeKg(),
            item.getValorUnitario(),
            item.getValorTotal()
        );
    }
}