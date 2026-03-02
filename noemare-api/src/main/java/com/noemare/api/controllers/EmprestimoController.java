package com.noemare.api.controllers;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.noemare.api.dtos.request.EmprestimoRequest;
import com.noemare.api.dtos.response.EmprestimoResponse;
import com.noemare.api.services.EmprestimoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/emprestimos") 
public class EmprestimoController {

    private final EmprestimoService emprestimoService;

    public EmprestimoController(EmprestimoService emprestimoService) { 
        this.emprestimoService = emprestimoService; 
    }

    @PostMapping
    public ResponseEntity<EmprestimoResponse> criar(@RequestBody @Valid EmprestimoRequest request) { 
        EmprestimoResponse response = emprestimoService.criar(request); 
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Método GET para buscar a lista de empréstimos e preencher a tabela
    @GetMapping
    public ResponseEntity<List<EmprestimoResponse>> listarTodos( 
            @RequestParam(required = false) Integer ano) {
        
        // Chama o service que nós já tínhamos criado e devolve a lista
        List<EmprestimoResponse> response = emprestimoService.listarTodos(); 
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/fornecedor/{fornecedorId}/investimentos")
    public ResponseEntity<List<EmprestimoResponse>> listarHistoricoInvestimentos(@PathVariable Long fornecedorId) {
        List<EmprestimoResponse> historico = emprestimoService.listarHistoricoInvestimentosPorFornecedor(fornecedorId);
        return ResponseEntity.ok(historico);
    }

    // 👉 NOVO: Endpoint para gerar e baixar o PDF do extrato de investimentos
    @GetMapping("/fornecedor/{fornecedorId}/investimentos/relatorio-pdf")
    public ResponseEntity<byte[]> gerarRelatorioPdfInvestimentos(@PathVariable Long fornecedorId) {
        byte[] pdf = emprestimoService.gerarRelatorioPdfInvestimentos(fornecedorId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "extrato-investimentos.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }
}