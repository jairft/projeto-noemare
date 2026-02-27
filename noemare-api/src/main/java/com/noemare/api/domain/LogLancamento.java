package com.noemare.api.domain;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "logs_lancamentos")
@Getter
@Setter
@NoArgsConstructor
public class LogLancamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String acao; // Ex: "CRIAR_INVESTIMENTO", "PAGAR_NOTA"

    @Column(name = "entidade_afetada", nullable = false)
    private String entidadeAfetada; // Ex: "Investimento", "NotaFornecedor"

    @Column(name = "entidade_id", nullable = false)
    private Long entidadeId; // O ID do registo que foi afetado

    @Column(length = 1000, nullable = false)
    private String detalhes; // Descrição do que aconteceu

    @Column(name = "usuario_email")
    private String usuarioEmail;

    @Setter(AccessLevel.NONE)
    @Column(name = "data_hora", nullable = false, updatable = false)
    private LocalDateTime dataHora;

    public LogLancamento(String acao, String entidadeAfetada, Long entidadeId, String detalhes, String usuarioEmail) {
        this.acao = acao;
        this.entidadeAfetada = entidadeAfetada;
        this.entidadeId = entidadeId;
        this.detalhes = detalhes;
        this.usuarioEmail = usuarioEmail;
    }

    @PrePersist
    public void prePersist() {
        if (this.dataHora == null) {
            this.dataHora = LocalDateTime.now();
        }
    }
}