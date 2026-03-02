package com.noemare.api.dtos.response;

import java.math.BigDecimal;

public record ItemNotaHistoricoResponse(
    String nomeProduto,
    String tipo,
    String tamanho,
    BigDecimal quantidadeKg,
    BigDecimal valorItem
) {}