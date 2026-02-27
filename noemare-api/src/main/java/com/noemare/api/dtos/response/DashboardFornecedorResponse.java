package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.util.List;

public record DashboardFornecedorResponse(
    BigDecimal totalAdiantadoGlobal,
    BigDecimal totalNotasGlobal,
    BigDecimal totalInvestimentoGlobal,
    BigDecimal totalPagoInvestimentoGlobal, // 👉 NOVO CAMPO
    BigDecimal totalLiquidoAPagar,
    BigDecimal totalLiquidoAReceber,
    List<HistoricoIndividualFornecedorResponse> fornecedores
) {}
