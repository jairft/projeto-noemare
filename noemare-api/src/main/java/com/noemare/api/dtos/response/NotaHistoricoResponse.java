package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime; // 👉 Import correto para a sua entidade
import java.util.List;

public record NotaHistoricoResponse(
    Long id,
    String numeroNota,
    LocalDateTime dataNota, // 👉 Atualizado para bater com a entidade
    BigDecimal valorTotalNota,
    String status,
    List<ItemNotaHistoricoResponse> itens
) {}