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
@Table(name = "produtos_pescado") // Mudei o nome da tabela para refletir que agora é um catálogo
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class ClassificacaoProduto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome; // Ex: "Camarão Rosa Pistola", "Robalo Inteiro"

    @Column(nullable = false)
    private String tipo; // Ex: "Camarão Rosa", "Robalo"

    // O tamanho é opcional no Front-end, mas no banco garantimos que não fica nulo
    @Column(nullable = false) 
    private String tamanho;

    @Column(name = "preco_unitario", nullable = false)
    private BigDecimal precoUnitario;

    // --- REGRA DE NEGÓCIO ---
    // Executa antes de salvar (Insert) ou atualizar (Update) no banco
    @PrePersist
    @PreUpdate
    public void verificarTamanho() {
        if (this.tamanho == null || this.tamanho.trim().isEmpty()) {
            this.tamanho = "UNICO"; // Se o front-end mandar vazio ou nulo, assume "UNICO"
        }
        
        // Opcional: Padronizar para maiúsculas para evitar duplicações ("unico" vs "UNICO")
        this.tamanho = this.tamanho.toUpperCase(); 
    }
}