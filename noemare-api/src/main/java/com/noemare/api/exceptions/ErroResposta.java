package com.noemare.api.exceptions;

import java.time.LocalDateTime;

public record ErroResposta(
        LocalDateTime timestamp,
        Integer status,
        String erro,
        String mensagem,
        String path
) {
}