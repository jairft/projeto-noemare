package com.noemare.api.dtos.response;

import java.math.BigDecimal;

public record ItemAgrupadoResponse(
    String nomeProduto,
    String tipo,      // Novo campo
    String tamanho,   // Novo campo
    BigDecimal totalKg,
    BigDecimal totalValor
) {}
