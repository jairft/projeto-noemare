package com.noemare.api.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalTime;

@Entity
@Table(name = "configuracoes_sistema")
@Getter
@Setter
public class ConfiguracaoSistema {

    @Id
    private Long id = 1L; // Sempre será 1, pois só teremos uma linha de configuração global

    @Column(name = "dias_retencao_logs", nullable = false)
    private Integer diasRetencaoLogs = 30; // Valor padrão: 30 dias

    @Column(name = "horario_limpeza_logs", nullable = false)
    private LocalTime horarioLimpezaLogs = LocalTime.of(3, 0); // Valor padrão: 03:00 da manhã
    
    // Construtor vazio para o JPA
    public ConfiguracaoSistema() {
    }
}