package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.noemare.api.domain.Boleto;
import com.noemare.api.domain.enums.StatusBoleto;

public record BoletoResponse(
    Long id,
    String descricao,
    String nomeBanco, 
    String codigoBarras,
    BigDecimal valor,
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate dataVencimento,
    StatusBoleto status
) {
    public BoletoResponse(Boleto b) {
        this(
            b.getId(), 
            b.getDescricao(), 
            b.getNomeBanco(), 
            b.getCodigoBarras(), 
            b.getValor(), 
            b.getDataVencimento(), 
            b.getStatus()
        );
    }
}