package com.noemare.api.dtos.response;

public record NotificacaoResponse(
    String titulo,
    String mensagem,
    String tipo, 
    Long id      
) {
}