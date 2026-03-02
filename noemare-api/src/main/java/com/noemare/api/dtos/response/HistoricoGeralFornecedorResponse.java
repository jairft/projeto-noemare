package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.util.List;

public record HistoricoGeralFornecedorResponse(
    BigDecimal kgGeral,
    BigDecimal valorGeral,
    List<ItemAgrupadoResponse> itensAgrupados,
    List<NotaHistoricoResponse> notas
) {}