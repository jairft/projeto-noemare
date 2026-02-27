package com.noemare.api.dtos.response;

import java.math.BigDecimal;

public record SaldoFornecedorResponse(
    BigDecimal saldoInvestimento, 
    BigDecimal saldoAdiantamento
) {}