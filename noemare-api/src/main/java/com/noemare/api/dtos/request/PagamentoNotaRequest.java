package com.noemare.api.dtos.request;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record PagamentoNotaRequest(
        @NotNull(message = "O ID da nota é obrigatório")
        Long notaId,

        @NotNull(message = "O valor pago em dinheiro/pix é obrigatório")
        @PositiveOrZero(message = "O valor pago não pode ser negativo")
        BigDecimal valorPagoDinheiro,

        @NotNull(message = "O valor abatido do investimento é obrigatório")
        @PositiveOrZero(message = "O valor abatido não pode ser negativo")
        BigDecimal valorAbatidoInvestimento,

        @NotNull(message = "O valor abatido do adiantamento é obrigatório")
        @PositiveOrZero(message = "O valor abatido não pode ser negativo")
        BigDecimal valorAbatidoAdiantamento,

        @NotNull(message = "A data da operação é obrigatória")
        LocalDate dataOperacao,

        String observacao
) {
}