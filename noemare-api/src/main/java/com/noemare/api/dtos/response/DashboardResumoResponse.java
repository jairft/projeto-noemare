package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.util.Map;

// Exemplo de como deve estar o seu DTO
public record DashboardResumoResponse(
    BigDecimal totalAPagar,
    BigDecimal totalAdiantado,
    BigDecimal totalPagoMes,
    long notasPendentes,
    Map<Integer, Double> volumePorMes // Adicione este campo se não existir
) {}