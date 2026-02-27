package com.noemare.api.dtos.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record PagamentoEmprestimoRequest(
        @NotNull(message = "O ID do investimento é obrigatório")
        Long emprestimoId,

        @NotNull(message = "O valor do pagamento é obrigatório")
        @Positive(message = "O valor do pagamento deve ser maior que zero")
        BigDecimal valor,

        String descricao
) {
}