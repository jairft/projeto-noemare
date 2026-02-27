package com.noemare.api.dtos.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.noemare.api.domain.Funcionario;
import com.noemare.api.domain.enums.RoleFuncionario;
import com.noemare.api.domain.enums.StatusConta;

public record FuncionarioResponse(
        Long id,
        String nome,
        String sobrenome,
        String email,
        RoleFuncionario role,
        StatusConta statusConta,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime dataCadastro,
        Boolean solicitouRecuperacaoSenha // <-- CAMPO ADICIONADO AQUI
) {
    public FuncionarioResponse(Funcionario funcionario) {
        this(
            funcionario.getId(),
            funcionario.getNome(),
            funcionario.getSobrenome(),
            funcionario.getEmail(),
            funcionario.getRole(),
            funcionario.getStatusConta(),
            funcionario.getDataCadastro(),
            funcionario.getSolicitouRecuperacaoSenha() != null ? funcionario.getSolicitouRecuperacaoSenha() : false
        );
    }
}