package com.noemare.api.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "nota_itens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class NotaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nota_id", nullable = false)
    private NotaFornecedor nota;

    // Relacionamento com o seu Cardápio/Catálogo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "produto_id", nullable = false)
    private ClassificacaoProduto produto;

    @Column(name = "quantidade_kg", nullable = false)
    private BigDecimal quantidadeKg;

    @Column(name = "valor_unitario", nullable = false)
    private BigDecimal valorUnitario;

    @Column(name = "valor_total", nullable = false)
    private BigDecimal valorTotal;

    // --- REGRA DE NEGÓCIO ---
    // Calcula o valor total do item automaticamente antes de salvar no banco
    @PrePersist
    @PreUpdate
    public void calcularValorTotal() {
        if (this.quantidadeKg != null && this.valorUnitario != null) {
            this.valorTotal = this.quantidadeKg.multiply(this.valorUnitario);
        } else {
            this.valorTotal = BigDecimal.ZERO;
        }
    }
}