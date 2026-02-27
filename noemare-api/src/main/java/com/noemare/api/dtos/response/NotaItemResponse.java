package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import com.noemare.api.domain.NotaItem;

public record NotaItemResponse(
    Long id,
    Long produtoId,
    String nomeProduto, // Nome vindo do cardápio
    String especie,     // Espécie vinda do cardápio
    String tamanho,     // Tamanho vindo do cardápio
    BigDecimal quantidadeKg,
    BigDecimal valorUnitario,
    BigDecimal valorTotal
) {
    public NotaItemResponse(NotaItem item) {
        this(
            item.getId(),
            item.getProduto().getId(),
            item.getProduto().getNome(),
            item.getProduto().getTipo(),
            item.getProduto().getTamanho(),
            item.getQuantidadeKg(),
            item.getValorUnitario(),
            item.getValorTotal()
        );
    }
}