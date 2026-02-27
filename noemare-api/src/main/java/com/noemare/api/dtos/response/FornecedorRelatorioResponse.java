package com.noemare.api.dtos.response;

import java.math.BigDecimal;

public record FornecedorRelatorioResponse(
    String nome,
    BigDecimal totalComprado,
    BigDecimal totalPago,
    BigDecimal pendenciaNotas,
    BigDecimal saldoDevedor,
    BigDecimal saldoInvestimento // 👉 NOVO
) {}