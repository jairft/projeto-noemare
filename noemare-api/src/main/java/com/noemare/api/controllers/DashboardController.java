package com.noemare.api.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.dtos.response.DashboardResumoResponse;
import com.noemare.api.dtos.response.DashboardFornecedorResponse;
import com.noemare.api.services.DashboardService;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/resumo")
    public ResponseEntity<DashboardResumoResponse> obterResumo(
            @RequestParam(name = "ano", required = false) Integer ano 
    ) {
        return ResponseEntity.ok(dashboardService.obterResumo(ano));
    }

    @GetMapping("/relatorio-fornecedores")
    public ResponseEntity<DashboardFornecedorResponse> obterRelatorioFornecedores(
            @RequestParam(name = "ano", required = false) Integer ano // 👉 Adicionado o Parâmetro de Ano
    ) {
        // Agora o Controller recebe o ano do Angular e repassa para o Service filtrar os saldos e produção
        return ResponseEntity.ok(dashboardService.obterRelatorioFornecedores(ano));
    }
}