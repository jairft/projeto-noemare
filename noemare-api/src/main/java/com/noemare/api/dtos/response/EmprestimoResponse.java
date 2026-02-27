package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.noemare.api.domain.Emprestimo; // Atualizado
import com.noemare.api.domain.enums.StatusEmprestimo;
import com.noemare.api.domain.enums.TipoEmprestimo;

public record EmprestimoResponse( // Atualizado
        Long id,
        Long fornecedorId,
        String fornecedorNome,
        TipoEmprestimo tipo,
        BigDecimal valorTotal,
        BigDecimal saldoRestante,
        StatusEmprestimo status,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime dataEmprestimo, // Atualizado
        String descricao
) {
    public EmprestimoResponse(Emprestimo emprestimo) { // Atualizado
        this(
            emprestimo.getId(),
            emprestimo.getFornecedor().getId(),
            emprestimo.getFornecedor().getNome(),
            emprestimo.getTipo(),
            emprestimo.getValorTotal(),
            emprestimo.getSaldoRestante(), // Garantido pelo seu @PrePersist
            emprestimo.getStatus(),        // Garantido pelo seu @PrePersist
            emprestimo.getDataEmprestimo(), // Atualizado
            emprestimo.getDescricao()
        );
    }
}