package com.noemare.api.dtos.response;

import java.math.BigDecimal;

public record ItemRelatorioResponse(
    String produto,
    BigDecimal quantidadeKg,
    BigDecimal valorTotal,
    BigDecimal precoUnitario
) {}