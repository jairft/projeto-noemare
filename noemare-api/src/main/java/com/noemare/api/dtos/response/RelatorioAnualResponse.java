package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.util.List;

public record RelatorioAnualResponse(
    BigDecimal totalCompradoGeral,
    BigDecimal totalPagoGeral,
    BigDecimal saldoPendenteGeral,
    BigDecimal totalKgGeral,              // 👉 NOVO: Peso total da safra
    List<FornecedorRelatorioResponse> fornecedores,
    List<ItemRelatorioResponse> itens,
    List<BigDecimal> volumePorMes
) {}