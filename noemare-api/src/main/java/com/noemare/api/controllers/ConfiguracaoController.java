package com.noemare.api.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.noemare.api.domain.ConfiguracaoSistema;
import com.noemare.api.services.ConfiguracaoSistemaService;

@RestController
@RequestMapping("/api/configuracoes")
public class ConfiguracaoController {

    private final ConfiguracaoSistemaService service;

    public ConfiguracaoController(ConfiguracaoSistemaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ConfiguracaoSistema> obter() {
        return ResponseEntity.ok(service.obterConfiguracao());
    }

    @PutMapping
    public ResponseEntity<ConfiguracaoSistema> atualizar(@RequestBody ConfiguracaoSistema dados) {
        return ResponseEntity.ok(service.atualizar(dados));
    }
}