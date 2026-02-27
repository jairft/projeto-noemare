package com.noemare.api.dtos.response;

import java.math.BigDecimal;

public record ProducaoItemResumoResponse(
    String nomeProduto, 
    String tipoProduto,
    String tamanho, 
    BigDecimal totalKg 
) {}