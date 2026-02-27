package com.noemare.api.dtos.request;

import java.math.BigDecimal;
import java.time.LocalDate; // 👉 Importe o LocalDate
import java.time.LocalDateTime;

import com.noemare.api.domain.enums.TipoEmprestimo;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EmprestimoRequest(
        @NotNull(message = "O ID do fornecedor é obrigatório.")
        Long fornecedorId,

        @NotNull(message = "A data do investimento é obrigatória.")
        LocalDateTime dataEmprestimo, // 👈 ADICIONE ESTE CAMPO AQUI

        @NotNull(message = "O tipo de investimento é obrigatório.")
        TipoEmprestimo tipo,

        @NotNull(message = "O valor total é obrigatório.")
        @DecimalMin(value = "0.01", message = "O valor do investimento deve ser maior que zero.")
        BigDecimal valorTotal,

        @Size(max = 500, message = "A descrição não pode exceder 500 caracteres.")
        String descricao
) {
}