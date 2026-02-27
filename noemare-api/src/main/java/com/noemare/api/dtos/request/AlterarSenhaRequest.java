package com.noemare.api.dtos.request;

public record AlterarSenhaRequest(
    String senhaAtual,
    String novaSenha
) {}