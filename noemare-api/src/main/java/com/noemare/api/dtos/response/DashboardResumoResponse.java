package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.util.Map;

public record DashboardResumoResponse(
    BigDecimal totalAPagar,
    BigDecimal totalAdiantado,
    BigDecimal totalPagoMes,
    long notasPendentes,
    Map<Integer, Double> volumePorMes,
    BigDecimal volumeTotalAno
) {}