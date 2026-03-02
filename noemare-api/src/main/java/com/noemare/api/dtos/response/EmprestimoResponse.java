package com.noemare.api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.noemare.api.domain.Emprestimo; 
import com.noemare.api.domain.enums.StatusEmprestimo;
import com.noemare.api.domain.enums.TipoEmprestimo;

public record EmprestimoResponse( 
        Long id,
        Long fornecedorId,
        String fornecedorNome,
        TipoEmprestimo tipo,
        BigDecimal valorTotal,
        BigDecimal saldoRestante,
        StatusEmprestimo status,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        LocalDateTime dataEmprestimo, 
        String descricao,
    
        List<PagamentoEmprestimoResponse> pagamentos
) {
    public EmprestimoResponse(Emprestimo emprestimo) { 
        this(
            emprestimo.getId(),
            emprestimo.getFornecedor().getId(),
            emprestimo.getFornecedor().getNome(),
            emprestimo.getTipo(),
            emprestimo.getValorTotal(),
            emprestimo.getSaldoRestante(), 
            emprestimo.getStatus(),        
            emprestimo.getDataEmprestimo(), 
            emprestimo.getDescricao(),
          
            emprestimo.getPagamentos() != null ? 
                emprestimo.getPagamentos().stream()
                          .map(PagamentoEmprestimoResponse::new)
                          .toList() 
                : List.of() // Garante que retorne um array vazio [] em vez de null
        );
    }
}