package com.noemare.api.dtos.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record NotaFornecedorRequest(
        @NotNull(message = "O ID do fornecedor é obrigatório")
        Long fornecedorId,

        // 👉 NOVO: Recebe o número da nota
        String numeroNota,

        // 👉 NOVO: Recebe a data da compra vinda do front-end
        @NotNull(message = "A data da nota é obrigatória")
        LocalDate dataNota,

        String descricao,

        // Recebe a lista de itens que o Angular envia
        @NotEmpty(message = "A nota deve conter pelo menos um item")
        @Valid 
        List<NotaItemRequest> itens
) {
}