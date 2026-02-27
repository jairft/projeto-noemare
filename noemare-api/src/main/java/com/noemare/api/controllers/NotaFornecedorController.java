package com.noemare.api.controllers;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.dtos.request.NotaFornecedorRequest;
import com.noemare.api.dtos.response.HistoricoNotaResponse;
import com.noemare.api.dtos.response.HistoricoPagamentoResponse;
import com.noemare.api.dtos.response.NotaFornecedorResponse;
import com.noemare.api.services.NotaFornecedorService;
import com.noemare.api.services.PagamentoNotaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notas-fornecedor")
public class NotaFornecedorController {

    private final NotaFornecedorService notaService;
    private final PagamentoNotaService pagamentoService;

    public NotaFornecedorController(NotaFornecedorService notaService, PagamentoNotaService pagamentoService) {
        this.notaService = notaService;
        this.pagamentoService = pagamentoService;
    }

    @PostMapping
    public ResponseEntity<NotaFornecedorResponse> gerarNota(@RequestBody @Valid NotaFornecedorRequest request) {
        NotaFornecedorResponse response = notaService.gerarNota(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 👉 NOVO: Endpoint para Editar a Nota
    @PutMapping("/{id}")
    public ResponseEntity<NotaFornecedorResponse> editarNota(
            @PathVariable Long id, 
            @RequestBody @Valid NotaFornecedorRequest request) {
        NotaFornecedorResponse response = notaService.editarNota(id, request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<NotaFornecedorResponse>> listarTodas(
            @RequestParam(name = "ano", required = false) Integer ano 
    ) {
        List<NotaFornecedorResponse> notas = notaService.listarTodas(ano);
        return ResponseEntity.ok(notas);
    }

    @GetMapping("/{id}/historico-pagamentos")
    public ResponseEntity<List<HistoricoPagamentoResponse>> buscarHistorico(@PathVariable Long id) {
        List<HistoricoPagamentoResponse> historico = pagamentoService.buscarHistoricoPorNotaId(id);
        return ResponseEntity.ok(historico);
    }

    @GetMapping("/historico")
    public ResponseEntity<List<HistoricoNotaResponse>> buscarHistorico(
            @RequestParam(required = false) Integer ano, 
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        
        List<HistoricoNotaResponse> historico = notaService.buscarHistoricoFiltrado(ano, dataInicio, dataFim);
        return ResponseEntity.ok(historico);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        notaService.excluirNota(id);
        return ResponseEntity.noContent().build();
    }
}