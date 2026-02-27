package com.noemare.api.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.dtos.response.RelatorioAnualResponse;
import com.noemare.api.services.RelatorioService;

@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    private final RelatorioService relatorioService;

    public RelatorioController(RelatorioService relatorioService) {
        this.relatorioService = relatorioService;
    }

    @GetMapping("/resumo-anual")
    public ResponseEntity<RelatorioAnualResponse> obterResumoAnual(
            @RequestParam(name = "ano", required = false) Integer ano
    ) {
        // O service já está preparado para tratar o ano nulo e usar o anoFiltro final
        RelatorioAnualResponse resumo = relatorioService.gerarResumoAnual(ano);
        return ResponseEntity.ok(resumo);
    }
}