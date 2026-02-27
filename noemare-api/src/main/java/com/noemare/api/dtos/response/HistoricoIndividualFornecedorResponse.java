package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.util.List;

public record HistoricoIndividualFornecedorResponse(
    Long id,
    String nomeFornecedor,
    BigDecimal saldoAdiantamento,
    BigDecimal saldoInvestimento,
    BigDecimal investimentoPago, // 👉 NOVO CAMPO
    BigDecimal saldoNotas,
    BigDecimal saldoLiquido,
    List<ProducaoItemResumoResponse> producao
) {}
