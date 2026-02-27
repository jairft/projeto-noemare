package com.noemare.api.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.noemare.api.domain.enums.StatusNota;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "notas_fornecedor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class NotaFornecedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private Fornecedor fornecedor;

    // 👉 NOVO: Adicionado o campo para armazenar o número da nota fiscal/recibo
    @Column(name = "numero_nota", length = 50)
    private String numeroNota;

    // 👉 AJUSTADO: Liberado o Setter para que o Back-end aceite a data escolhida no Front-end
    @Column(name = "data_nota", nullable = false)
    private LocalDateTime dataNota;

    @Column(name = "valor_total", nullable = false)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    @Column(length = 500)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusNota status;

    @Column(name = "valor_pago", nullable = false)
    private BigDecimal valorPago = BigDecimal.ZERO;

    // Relacionamento mantido, mas agora NotaItem aponta para ClassificacaoProduto (Cardápio)
    @OneToMany(mappedBy = "nota", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NotaItem> itens = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.dataNota == null) {
            this.dataNota = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = StatusNota.ABERTA;
        }
    }

    /**
     * Adiciona um item à nota, estabelece o vínculo bidirecional 
     * e atualiza o valor total da nota.
     */
    public void adicionarItem(NotaItem item) {
        this.itens.add(item);
        item.setNota(this);
        
        // Garante que o valor total do item esteja calculado antes de somar na nota
        item.calcularValorTotal(); 
        
        if (item.getValorTotal() != null) {
            this.valorTotal = this.valorTotal.add(item.getValorTotal());
        }
    }
    
    public void registrarPagamento(BigDecimal valorBruto) {
        if (valorBruto != null && valorBruto.compareTo(BigDecimal.ZERO) > 0) {
            this.valorPago = this.valorPago.add(valorBruto);
            
            // Verifica o status com base no valor total acumulado dos itens
            if (this.valorPago.compareTo(this.valorTotal) >= 0) {
                this.status = StatusNota.PAGA;
            } else {
                this.status = StatusNota.PARCIAL;
            }
        }
    }
}