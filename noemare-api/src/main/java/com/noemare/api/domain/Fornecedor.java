package com.noemare.api.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.noemare.api.domain.enums.StatusFornecedor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "fornecedores")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Fornecedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Setter apenas nos campos que podem ser editados diretamente
    @Setter
    @Column(nullable = false)
    private String nome;

    // 👉 NOVO: Saldo de Investimento
    @Column(name = "saldo_devedor_investimento", nullable = false)
    private BigDecimal saldoDevedorInvestimento = BigDecimal.ZERO;

    // 👉 NOVO: Saldo de Adiantamento
    @Column(name = "saldo_devedor_adiantamento", nullable = false)
    private BigDecimal saldoDevedorAdiantamento = BigDecimal.ZERO;

    // Sem Setter público. O saldo credor é apenas calculado
    @Column(name = "saldo_credor", nullable = false)
    private BigDecimal saldoCredor = BigDecimal.ZERO;

    @Column(name = "data_cadastro", nullable = false)
    private LocalDateTime dataCadastro;

    @OneToMany(mappedBy = "fornecedor", fetch = FetchType.LAZY)
    private List<NotaFornecedor> notas = new ArrayList<>();

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusFornecedor status;

    @PrePersist
    public void prePersist() {
        this.dataCadastro = LocalDateTime.now();
        this.status = StatusFornecedor.ATIVO;
        this.saldoDevedorInvestimento = BigDecimal.ZERO; // 👉 Atualizado
        this.saldoDevedorAdiantamento = BigDecimal.ZERO; // 👉 Atualizado
        this.saldoCredor = BigDecimal.ZERO;
    }

    // --- MÉTODOS DE NEGÓCIO PARA ENCAPSULAR CÁLCULOS ---

    // 👉 Novos métodos para INVESTIMENTO
    public void adicionarSaldoDevedorInvestimento(BigDecimal valor) {
        if (valor != null && valor.compareTo(BigDecimal.ZERO) > 0) {
            this.saldoDevedorInvestimento = this.saldoDevedorInvestimento.add(valor);
        }
    }

    public void abaterSaldoDevedorInvestimento(BigDecimal valor) {
        if (valor != null && valor.compareTo(BigDecimal.ZERO) > 0) {
            this.saldoDevedorInvestimento = this.saldoDevedorInvestimento.subtract(valor);
        }
    }

    // 👉 Novos métodos para ADIANTAMENTO
    public void adicionarSaldoDevedorAdiantamento(BigDecimal valor) {
        if (valor != null && valor.compareTo(BigDecimal.ZERO) > 0) {
            this.saldoDevedorAdiantamento = this.saldoDevedorAdiantamento.add(valor);
        }
    }

    public void abaterSaldoDevedorAdiantamento(BigDecimal valor) {
        if (valor != null && valor.compareTo(BigDecimal.ZERO) > 0) {
            this.saldoDevedorAdiantamento = this.saldoDevedorAdiantamento.subtract(valor);
        }
    }

    public void adicionarSaldoCredor(BigDecimal valor) {
        if (valor != null && valor.compareTo(BigDecimal.ZERO) > 0) {
            this.saldoCredor = this.saldoCredor.add(valor);
        }
    }

    public void abaterSaldoCredor(BigDecimal valor) {
        if (valor != null && valor.compareTo(BigDecimal.ZERO) > 0) {
            this.saldoCredor = this.saldoCredor.subtract(valor);
        }
    }

    public void subtrairSaldoCredor(BigDecimal valor) {
        if (valor != null) {
            // Garante que o saldo não fique negativo indevidamente
            this.saldoCredor = this.saldoCredor.subtract(valor);
            if (this.saldoCredor.compareTo(BigDecimal.ZERO) < 0) {
                this.saldoCredor = BigDecimal.ZERO;
            }
        }
    }
}