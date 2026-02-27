package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.noemare.api.domain.NotaFornecedor;
import com.noemare.api.domain.enums.StatusNota;

public record NotaFornecedorResponse(
        Long id,
        Long fornecedorId,
        String fornecedorNome,
        String numeroNota, 
        
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime dataNota,
        BigDecimal valorTotal,
        BigDecimal valorPago,
        String descricao,
        StatusNota status,
        List<NotaItemResponse> itens // Adicionado: Para retornar os detalhes da compra
) {
    public NotaFornecedorResponse(NotaFornecedor nota) {
        this(
            nota.getId(),
            nota.getFornecedor().getId(),
            nota.getFornecedor().getNome(),
            
            // 👉 NOVO: Pega da entidade
            nota.getNumeroNota(), 
            
            nota.getDataNota(),
            nota.getValorTotal(),
            nota.getValorPago() != null ? nota.getValorPago() : BigDecimal.ZERO, 
            nota.getDescricao(),
            nota.getStatus(),
            // Mapeia os itens da entidade para o DTO de resposta
            nota.getItens() != null ? 
                nota.getItens().stream().map(NotaItemResponse::new).toList() : List.of()
        );
    }
}