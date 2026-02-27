package com.noemare.api.dtos.request;

import com.noemare.api.domain.enums.RoleFuncionario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FuncionarioRegistroRequest(
        @NotBlank(message = "O nome é obrigatório")
        String nome,

        @NotBlank(message = "O sobrenome é obrigatório")
        String sobrenome,

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Formato de e-mail inválido")
        String email,

        @NotBlank(message = "A senha é obrigatória")
        String senha,

        @NotBlank(message = "A confirmação de senha é obrigatória")
        String confirmacaoSenha, // Novo campo

        @NotNull(message = "A role (ADMIN/USER) é obrigatória")
        RoleFuncionario role,

        String codigoMestre
) {
}