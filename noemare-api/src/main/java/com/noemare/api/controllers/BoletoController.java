package com.noemare.api.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping; 
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.domain.Funcionario; 
import com.noemare.api.dtos.request.BoletoRequest;
import com.noemare.api.dtos.response.BoletoResponse;
import com.noemare.api.dtos.response.NotificacaoResponse; // 👉 IMPORTANTE: Novo import!
import com.noemare.api.services.BoletoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/boletos")
public class BoletoController {

    private final BoletoService boletoService;

    public BoletoController(BoletoService boletoService) {
        this.boletoService = boletoService;
    }

    @PostMapping
    public ResponseEntity<BoletoResponse> cadastrar(
            @RequestBody @Valid BoletoRequest request,
            @AuthenticationPrincipal Funcionario usuarioLogado) { 
            
        BoletoResponse response = boletoService.salvar(request, usuarioLogado);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<BoletoResponse>> listarTodos(
            @RequestParam(name = "ano", required = false) Integer ano) {
        return ResponseEntity.ok(boletoService.listarTodos(ano));
    }

    @GetMapping("/alertas")
    public ResponseEntity<List<BoletoResponse>> buscarAlertas() {
        return ResponseEntity.ok(boletoService.buscarAlertasVencimento());
    }

    // 👉 NOVO: Endpoint para o Angular buscar os dados do sino!
    @GetMapping("/notificacoes")
    public ResponseEntity<List<NotificacaoResponse>> buscarNotificacoes(
            @RequestParam(name = "ano", required = false) Integer ano) {
        return ResponseEntity.ok(boletoService.buscarNotificacoesBoletos(ano));
    }

    @PatchMapping("/{id}/pagar")
    @ResponseStatus(HttpStatus.NO_CONTENT) 
    public void darBaixa(
            @PathVariable Long id, 
            @AuthenticationPrincipal Funcionario usuarioLogado) {
        boletoService.darBaixa(id, usuarioLogado);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(
            @PathVariable Long id, 
            @AuthenticationPrincipal Funcionario usuarioLogado) {
        boletoService.deletar(id, usuarioLogado);
    }
}