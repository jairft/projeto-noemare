package com.noemare.api.dtos.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BoletoRequest(
    @NotBlank(message = "A descrição do boleto é obrigatória.")
    String descricao,
    
    
    String nomeBanco,
    
    String codigoBarras,
    
    @NotNull(message = "O valor é obrigatório.")
    @Positive(message = "O valor deve ser maior que zero.")
    BigDecimal valor,
    
    @NotNull(message = "A data de vencimento é obrigatória.")
    LocalDate dataVencimento
) {}