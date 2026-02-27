package com.noemare.api.dtos.request;

import jakarta.validation.constraints.NotBlank;

public record FornecedorRequest(
        @NotBlank(message = "O nome do fornecedor é obrigatório")
        String nome
) {
}