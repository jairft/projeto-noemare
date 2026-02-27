package com.noemare.api.dtos.response;

import java.math.BigDecimal;

import com.noemare.api.domain.ClassificacaoProduto;

public record ClassificacaoProdutoResponse(
        Long id,
        String nome,
        String tipo,
        String tamanho,
        BigDecimal precoUnitario
) {
    public ClassificacaoProdutoResponse(ClassificacaoProduto classificacao) {
        this(
            classificacao.getId(),
            classificacao.getNome(),
            classificacao.getTipo(),
            classificacao.getTamanho(),
            classificacao.getPrecoUnitario()
        );
    }
}