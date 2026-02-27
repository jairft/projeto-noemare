package com.noemare.api.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.noemare.api.domain.enums.StatusEmprestimo; // Atualizado
import com.noemare.api.domain.enums.TipoEmprestimo; // Atualizado

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "emprestimos") // Atualizado
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Emprestimo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private Fornecedor fornecedor; 

    @Column(name = "valor_total", nullable = false)
    private BigDecimal valorTotal; 

    @Column(length = 500)
    private String descricao; 

    @Column(name = "data_emprestimo", nullable = false, updatable = false) // Atualizado
    private LocalDateTime dataEmprestimo; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoEmprestimo tipo; // Atualizado

    @Setter(AccessLevel.NONE) 
    @Column(name = "saldo_restante", nullable = false)
    private BigDecimal saldoRestante; 

    @Setter(AccessLevel.NONE) 
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusEmprestimo status; // Atualizado

    @PrePersist
    public void prePersist() {
        if (this.dataEmprestimo == null) {
            this.dataEmprestimo = LocalDateTime.now();
        }
        // No momento da criação, o saldo restante é igual ao valor total investido
        this.saldoRestante = this.valorTotal; 
        this.status = StatusEmprestimo.ABERTO; 
    }

    // --- MÉTODO DE NEGÓCIO (RN05) ---
    public void registrarPagamento(BigDecimal valorPago) {
        if (valorPago != null && valorPago.compareTo(BigDecimal.ZERO) > 0) {
            this.saldoRestante = this.saldoRestante.subtract(valorPago); 
            
            // Se o saldo chegar a zero ou ficar negativo por algum ajuste de centavos
            if (this.saldoRestante.compareTo(BigDecimal.ZERO) <= 0) { 
                this.saldoRestante = BigDecimal.ZERO; 
                this.status = StatusEmprestimo.QUITADO; 
            }
        }
    }
}