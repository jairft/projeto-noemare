package com.noemare.api.services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noemare.api.domain.ConfiguracaoSistema;
import com.noemare.api.repositories.ConfiguracaoSistemaRepository;

import jakarta.annotation.PostConstruct;

@Service
public class ConfiguracaoSistemaService {

    private final ConfiguracaoSistemaRepository repository;

    public ConfiguracaoSistemaService(ConfiguracaoSistemaRepository repository) {
        this.repository = repository;
    }

    // Cria as configurações padrão se ainda não existirem
    @PostConstruct
    public void iniciarConfiguracoes() {
        if (repository.count() == 0) {
            repository.save(new ConfiguracaoSistema());
        }
    }

    public ConfiguracaoSistema obterConfiguracao() {
        return repository.findById(1L).orElse(new ConfiguracaoSistema());
    }

    @Transactional
    public ConfiguracaoSistema atualizar(ConfiguracaoSistema dados) {
        ConfiguracaoSistema config = obterConfiguracao();
        config.setDiasRetencaoLogs(dados.getDiasRetencaoLogs());
        config.setHorarioLimpezaLogs(dados.getHorarioLimpezaLogs());
        return repository.save(config);
    }
}