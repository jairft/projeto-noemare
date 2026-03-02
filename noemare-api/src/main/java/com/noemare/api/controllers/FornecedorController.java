package com.noemare.api.controllers;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.domain.enums.StatusFornecedor;
import com.noemare.api.dtos.request.FornecedorRequest;
import com.noemare.api.dtos.response.FornecedorResponse;
import com.noemare.api.dtos.response.HistoricoGeralFornecedorResponse;
import com.noemare.api.dtos.response.SaldoFornecedorResponse;
import com.noemare.api.services.FornecedorService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/fornecedores")
public class FornecedorController {

    private final FornecedorService service;

    public FornecedorController(FornecedorService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<FornecedorResponse>> listarTodos(
            @RequestParam(name = "ano", required = false) Integer ano) {
        return ResponseEntity.ok(service.listarTodos(ano));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FornecedorResponse> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<FornecedorResponse> salvar(@RequestBody @Valid FornecedorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.salvar(request));
    }

    @PatchMapping("/{id}/nome")
    public ResponseEntity<FornecedorResponse> atualizarNome(
            @PathVariable Long id, 
            @RequestBody String novoNome) {
        return ResponseEntity.ok(service.atualizarNome(id, novoNome));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> alterarStatus(
            @PathVariable Long id, 
            @RequestParam StatusFornecedor status) {
        service.alterarStatus(id, status);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/saldos")
    public ResponseEntity<SaldoFornecedorResponse> buscarSaldosDevedores(@PathVariable Long id) {
        SaldoFornecedorResponse response = service.buscarSaldosDevedores(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/historico-geral")
    public ResponseEntity<HistoricoGeralFornecedorResponse> obterHistoricoGeral(@PathVariable Long id) {
        return ResponseEntity.ok(service.obterHistoricoGeral(id));
    }

    // 👉 NOVO: Endpoint para baixar o extrato em PDF
    @GetMapping("/{id}/relatorio-pdf")
    public ResponseEntity<byte[]> gerarRelatorioPdf(@PathVariable Long id) {
        byte[] pdf = service.gerarRelatorioPdf(id);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        // Define o nome do arquivo que aparecerá no download
        headers.setContentDispositionFormData("attachment", "extrato-fornecedor.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}